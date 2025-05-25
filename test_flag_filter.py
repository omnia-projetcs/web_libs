import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

        try:
            # Using main-dynamic-table now
            container_id = "main-dynamic-table"
            
            await page.goto("http://localhost:8000/demo.html", wait_until="networkidle", timeout=60000) 
            
            await page.wait_for_selector(f"#{container_id}", timeout=10000)
            print(f"Table container '#{container_id}' exists.")

            await page.wait_for_timeout(2000) # Give JS time to run

            container_class_list = await page.eval_on_selector(f"#{container_id}", "e => e.classList.toString()")
            print(f"Classes on #{container_id}: '{container_class_list}'")

            if "dynamic-table-wrapper" not in container_class_list:
                print(f"ERROR: 'dynamic-table-wrapper' class was not added to #{container_id}.")
                html_of_container = await page.eval_on_selector(f"#{container_id}", "e => e.innerHTML")
                print(f"HTML of #{container_id}: {html_of_container[:500]}...")
                await browser.close()
                return
            
            print("'dynamic-table-wrapper' class is present.")

            flag_header_th_selector = "th[data-column='countryCode']" # Corrected key to countryCode as per demo.html
            flag_header_th = page.locator(flag_header_th_selector)
            
            await flag_header_th.wait_for(state="visible", timeout=10000)
            print("Flag header cell is visible.")

            multi_select_trigger_selector = f"{flag_header_th_selector} .dt-header-multiselect .dt-multiselect-trigger"
            multi_select_trigger = page.locator(multi_select_trigger_selector)

            await multi_select_trigger.wait_for(state="visible", timeout=10000)
            print("Flag header multi-select trigger is visible.")

            print("Clicking on the Flag header multi-select trigger...")
            await multi_select_trigger.click()

            dropdown_selector = f"{flag_header_th_selector} .dt-header-multiselect .dt-multiselect-dropdown"
            dropdown_menu = page.locator(dropdown_selector)
            
            await dropdown_menu.wait_for(state="visible", timeout=5000)
            print("Dropdown menu is visible.")

            items = dropdown_menu.locator(".dt-multiselect-item")
            count = await items.count()
            print(f"Found {count} items in the dropdown.")

            if count == 0:
                print("No items found in the multi-select dropdown.")
                html_content = await dropdown_menu.inner_html()
                print(f"Dropdown HTML content: {html_content}")
                all_items_verified = False # Explicitly set to false
            else:
                print("Verifying items structure (checkbox, label, label text):")
                all_items_verified = True
                for i in range(count): 
                    item = items.nth(i)
                    checkbox = item.locator("input[type='checkbox']")
                    label = item.locator("label")
                    
                    is_checkbox_visible = await checkbox.is_visible()
                    checkbox_value = await checkbox.get_attribute("value")
                    
                    is_label_visible = await label.is_visible()
                    label_text = await label.text_content()
                    label_for = await label.get_attribute("for")
                    checkbox_id = await checkbox.get_attribute("id")

                    current_item_verified = (
                        is_checkbox_visible and 
                        is_label_visible and 
                        label_text and 
                        len(label_text.strip()) > 0 and
                        checkbox_value and 
                        len(checkbox_value.strip()) > 0 and
                        label_for == checkbox_id
                    )
                    
                    if i < 5 or not current_item_verified : # Print details for first 5 or any failing item
                        print(f"  Item {i+1}:")
                        print(f"    Checkbox visible: {is_checkbox_visible}, value: '{checkbox_value}', id: '{checkbox_id}'")
                        print(f"    Label visible: {is_label_visible}, text: '{label_text}', for: '{label_for}'")

                    if not current_item_verified:
                        all_items_verified = False
                        print(f"    VERIFICATION FAILED for item {i+1}")
                        item_html = await item.inner_html()
                        print(f"    Item HTML: {item_html}")
                    elif i < 5 :
                         print(f"    VERIFICATION PASSED for item {i+1}")
                
                if all_items_verified:
                    print("All items in dropdown successfully verified.")
                else:
                    print("Some items in dropdown failed verification.")
            
            if not all_items_verified:
                 raise Exception("Multi-select dropdown item verification failed.")


        except Exception as e:
            print(f"An error occurred: {e}")
            # await page.screenshot(path="error_screenshot.png") # Useful for debugging
            raise # Re-raise the exception to make the script fail for the CI/runner

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
