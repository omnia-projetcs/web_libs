import asyncio
from playwright.async_api import async_playwright
import re

def format_percent_test(value_str):
    """
    Mimics the 'percent:2' formatting for test comparison.
    Converts a number string (e.g., "0.05", "-0.025") to a percentage string (e.g., "5.00%", "-2.50%").
    """
    try:
        num = float(value_str)
        # Python's format mimics toLocaleString with fixed decimals for percentage
        return f"{num * 100:.2f}%"
    except ValueError:
        return value_str 

async def get_column_data(page, column_key, is_debug=False):
    """Helper function to get all data from a specific column in the table body."""
    cells_data = []
    headers = await page.locator(f"#main-dynamic-table thead th").all() 
    col_index = -1
    
    visible_th_elements = []
    for th_element in headers:
        if await th_element.is_visible():
            visible_th_elements.append(th_element)

    if is_debug:
        print(f"[get_column_data] Found {len(visible_th_elements)} visible header cells.")

    for i, header_element in enumerate(visible_th_elements):
        key_attr = await header_element.get_attribute("data-column")
        if is_debug:
            print(f"[get_column_data] Visible header {i}: data-column='{key_attr}'")
        if key_attr == column_key:
            col_index = i
            break
            
    if col_index == -1:
        print(f"[get_column_data] Column with key '{column_key}' not found among visible headers.")
        for i, header_element in enumerate(visible_th_elements):
             key_attr = await header_element.get_attribute("data-column")
             header_text = await header_element.text_content()
             print(f"  Visible header {i}: data-column='{key_attr}', text='{header_text.strip()}'")
        return []

    if is_debug:
        print(f"[get_column_data] Resolved column key '{column_key}' to visible index {col_index}.")

    rows = await page.locator("#main-dynamic-table tbody tr").all()
    if not rows:
        return []
        
    first_row_td_count = await rows[0].locator("td").count()
    if first_row_td_count == 0: 
        return []
    if first_row_td_count == 1:
        first_row_td_text = await rows[0].locator("td").first.text_content()
        if "no results" in first_row_td_text.lower() or "loading" in first_row_td_text.lower():
            if is_debug: print("[get_column_data] 'No results' or 'Loading' row found.")
            return []

    for i, row_element in enumerate(rows):
        td_count = await row_element.locator("td").count()
        if td_count == 1:
            td_text_content = await row_element.locator("td").first.text_content()
            if "no results" in td_text_content.lower() or "loading" in td_text_content.lower():
                continue 

        visible_cells_in_row = []
        all_tds_in_row = await row_element.locator("td").all()
        for cell_element in all_tds_in_row:
            if await cell_element.is_visible():
                visible_cells_in_row.append(cell_element)
        
        if col_index < len(visible_cells_in_row):
            cell_text = await visible_cells_in_row[col_index].text_content()
            cells_data.append(cell_text.strip() if cell_text else "")
            if is_debug and i < 3: 
                 print(f"[get_column_data] Row {i}, Col {col_index} ('{column_key}'): Text='{cell_text.strip()}'")
        elif is_debug:
            print(f"[get_column_data] Row {i}: col_index {col_index} out of bounds for {len(visible_cells_in_row)} visible cells.")
            for c_idx, c_elem in enumerate(visible_cells_in_row):
                print(f"  Visible cell {c_idx} text: '{await c_elem.text_content()}'")

    if is_debug:
        print(f"[get_column_data] Extracted data for '{column_key}' (first 5): {cells_data[:5]}")
    return cells_data

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
        test_passed = True # Assume true, set to false on any error
        error_messages = []

        try:
            container_id = "main-dynamic-table"
            target_column_key = "ytd" 
            
            await page.goto("http://localhost:8000/demo.html", wait_until="networkidle", timeout=60000)
            print("Page loaded.")

            await page.wait_for_selector(f"#{container_id}.dynamic-table-wrapper", timeout=15000)
            print(f"Table wrapper '#{container_id}.dynamic-table-wrapper' is present.")
            await page.wait_for_timeout(2000) 

            ytd_filter_trigger_selector = f".dynamic-table-filter-control div[data-filter-key='{target_column_key}'] .dt-custom-select-trigger"
            ytd_filter_trigger = page.locator(ytd_filter_trigger_selector)
            
            await ytd_filter_trigger.wait_for(state="visible", timeout=10000)
            print("YTD global multi-select filter trigger is visible.")

            initial_trigger_text = await ytd_filter_trigger.text_content()
            print(f"Initial YTD filter trigger text: '{initial_trigger_text}'")
            if not "All YTD" in initial_trigger_text:
                error_messages.append(f"Initial trigger text incorrect: '{initial_trigger_text}'")
                test_passed = False

            await ytd_filter_trigger.click()
            print("Clicked YTD filter trigger.")

            ytd_options_container_selector = f".dynamic-table-filter-control div[data-filter-key='{target_column_key}'] .dt-custom-options"
            ytd_options_container = page.locator(ytd_options_container_selector)
            await ytd_options_container.wait_for(state="visible", timeout=5000)
            print("YTD filter options dropdown is visible.")

            items = ytd_options_container.locator(".dt-multiselect-item")
            item_count = await items.count()
            print(f"Found {item_count} items in the YTD dropdown.")

            raw_value_option1 = ""
            raw_value_option2 = ""

            if item_count == 0:
                error_messages.append("No items found in YTD multi-select dropdown.")
                test_passed = False
            else:
                first_item_label_text = await items.first.locator("label").text_content()
                first_item_checkbox_value = await items.first.locator("input[type='checkbox']").get_attribute("value")
                raw_value_option1 = first_item_checkbox_value.strip() if first_item_checkbox_value else ""
                print(f"First item - Label: '{first_item_label_text}', Value: '{raw_value_option1}'")
                if not (first_item_label_text and raw_value_option1):
                    error_messages.append("First dropdown item lacks label text or checkbox value.")
                    test_passed = False
            
            if item_count > 0:
                initial_ytd_data = await get_column_data(page, target_column_key, is_debug=True)
                print(f"Initial YTD values in table (first 5): {initial_ytd_data[:5]}")
                if not initial_ytd_data:
                     error_messages.append(f"Could not retrieve initial YTD data from table.")
                     test_passed = False
                
                # Select the first option
                option1_checkbox = items.nth(0).locator("input[type='checkbox']")
                expected_formatted_value1 = format_percent_test(raw_value_option1)
                
                print(f"Attempting to select option 1: raw value '{raw_value_option1}' (expected formatted: '{expected_formatted_value1}')")
                await option1_checkbox.check()
                await page.wait_for_timeout(1000) 

                selected_trigger_text = await ytd_filter_trigger.text_content()
                print(f"Trigger text after selecting one: '{selected_trigger_text}'")
                if raw_value_option1 not in selected_trigger_text:
                    error_messages.append(f"Trigger text after selecting one option ('{raw_value_option1}') is incorrect: '{selected_trigger_text}'")
                    test_passed = False

                ytd_data_after_selection = await get_column_data(page, target_column_key)
                print(f"YTD values after selecting raw '{raw_value_option1}' (first 5): {ytd_data_after_selection[:5]}")
                
                if not ytd_data_after_selection and initial_ytd_data : 
                     error_messages.append(f"No data shown after filtering for '{expected_formatted_value1}'.")
                     test_passed = False
                for val in ytd_data_after_selection:
                    if val != expected_formatted_value1:
                        error_messages.append(f"Mismatch: table shows '{val}', expected formatted '{expected_formatted_value1}' after single select.")
                        test_passed = False; break
                
                if item_count > 1:
                    option2_checkbox = items.nth(1).locator("input[type='checkbox']")
                    raw_value_option2 = await option2_checkbox.get_attribute("value")
                    raw_value_option2 = raw_value_option2.strip() if raw_value_option2 else ""
                    expected_formatted_value2 = format_percent_test(raw_value_option2)

                    print(f"Attempting to select option 2: raw value '{raw_value_option2}' (expected formatted: '{expected_formatted_value2}')")
                    await option2_checkbox.check()
                    await page.wait_for_timeout(1000)

                    selected_trigger_text_2 = await ytd_filter_trigger.text_content()
                    print(f"Trigger text after selecting two: '{selected_trigger_text_2}'")
                    
                    print(f"DEBUG Check: selected_trigger_text_2 = '{selected_trigger_text_2}' (type: {type(selected_trigger_text_2)})")
                    print(f"DEBUG Check: raw_value_option1 = '{raw_value_option1}' (type: {type(raw_value_option1)})")
                    print(f"DEBUG Check: raw_value_option2 = '{raw_value_option2}' (type: {type(raw_value_option2)})")

                    check_A = "2 selected" in selected_trigger_text_2 # Should be false for 2 items
                    check_B1 = raw_value_option1 in selected_trigger_text_2
                    check_B2 = raw_value_option2 in selected_trigger_text_2
                    # For 2 items, display is "val1, val2"
                    correct_text_for_two = check_B1 and check_B2 and "," in selected_trigger_text_2

                    print(f"DEBUG Logic: '2 selected' in text? {check_A}")
                    print(f"DEBUG Logic: '{raw_value_option1}' in text? {check_B1}")
                    print(f"DEBUG Logic: '{raw_value_option2}' in text? {check_B2}")
                    print(f"DEBUG Logic: Is format correct for two? {correct_text_for_two}")
                    
                    if not correct_text_for_two:
                         error_messages.append(f"Trigger text after selecting two options ('{raw_value_option1}', '{raw_value_option2}') is incorrect: '{selected_trigger_text_2}'")
                         test_passed = False

                    ytd_data_after_2_selections = await get_column_data(page, target_column_key)
                    print(f"YTD values after two selections (first 5): {ytd_data_after_2_selections[:5]}")
                    
                    expected_values_formatted = [expected_formatted_value1, expected_formatted_value2]
                    if not ytd_data_after_2_selections and initial_ytd_data:
                        error_messages.append(f"No data shown after filtering for two options.")
                        test_passed = False
                    for val in ytd_data_after_2_selections:
                        if val not in expected_values_formatted:
                            error_messages.append(f"Mismatch: table shows '{val}', expected one of {expected_values_formatted} after two selections.")
                            test_passed = False; break
                    
                    print(f"Attempting to deselect option 2: raw '{raw_value_option2}'")
                    await option2_checkbox.uncheck()
                    await page.wait_for_timeout(1000)
                    ytd_data_after_deselection = await get_column_data(page, target_column_key)
                    if not ytd_data_after_deselection and initial_ytd_data:
                        error_messages.append(f"No data shown after deselecting one of two options.")
                        test_passed = False
                    for val in ytd_data_after_deselection:
                         if val != expected_formatted_value1: 
                            error_messages.append(f"Mismatch: table shows '{val}', expected '{expected_formatted_value1}' after deselecting second option.")
                            test_passed = False; break
                
                print(f"Attempting to deselect option 1: raw '{raw_value_option1}'")
                await option1_checkbox.uncheck() 
                await page.wait_for_timeout(1000)
                
                final_trigger_text = await ytd_filter_trigger.text_content()
                print(f"Trigger text after clearing all selections: '{final_trigger_text}'")
                if not "All YTD" in final_trigger_text: # Should revert to "All YTD"
                     error_messages.append(f"Trigger text after clearing selections incorrect: '{final_trigger_text}'")
                     test_passed = False

                ytd_data_after_clear = await get_column_data(page, target_column_key)
                if len(ytd_data_after_clear) != len(initial_ytd_data):
                    error_messages.append(f"Data count mismatch after clearing filter. Expected {len(initial_ytd_data)}, got {len(ytd_data_after_clear)}. Initial: {initial_ytd_data[:5]}, After Clear: {ytd_data_after_clear[:5]}")
                    test_passed = False

            await ytd_filter_trigger.click() 
            await page.wait_for_timeout(200) 
            if await ytd_options_container.is_visible():
                error_messages.append("Dropdown did not close after clicking trigger again.")
                test_passed = False
            else:
                print("Dropdown closed successfully.")

        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            await page.screenshot(path="global_multiselect_error.png") 
            test_passed = False # Ensure test_passed is false on script error
            error_messages.append(f"Test script error: {str(e)}") # Add script error to messages

        if test_passed and not error_messages:
            print("\nGlobal YTD multi-select filter test PASSED.")
        else:
            print("\nGlobal YTD multi-select filter test FAILED with the following issues:")
            for msg in error_messages:
                print(f"- {msg}")
            # Ensure the script exits with an error code if tests failed by re-raising or raising new assertion
            final_error_message = "Global multi-select filter test failed. Issues: " + " | ".join(error_messages)
            # To ensure a non-zero exit code that the testing framework can catch:
            if not test_passed or error_messages: # Redundant check, but safe
                 raise AssertionError(final_error_message)


        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
