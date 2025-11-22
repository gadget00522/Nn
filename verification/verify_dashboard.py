from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Wait for the server to be ready
    try:
        page.goto("http://localhost:8080")

        # Wait for content to load
        page.wait_for_timeout(5000)

        # Take screenshot of Dashboard
        page.screenshot(path="verification/dashboard.png")
        print("Dashboard screenshot taken")

        # Try to find the AI Chat button (robot icon)
        # Note: In React Native Web, icons might be rendered differently or as text.
        # We'll try to click the button based on the icon name or position in the top bar.

        # Taking a screenshot of the whole page to inspect structure if needed
        # but let's assume we want to verify the updated theme first.

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
