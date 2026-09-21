"""Run against npm run start: python tests/propertyLinks.browser.py

Requires Python Playwright and Microsoft Edge. All database responses are
fixtures; the test never creates or edits production houses.
"""
import json
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright, expect

BASE = 'http://localhost:3000'
HOUSE = {
    'id': 'new-house', 'custom_id': 'บ้านใหม่ 12/34',
    'project_name': 'บ้านทดสอบเพิ่มใหม่', 'house_number': '12/34',
    'price': 2500000, 'bedrooms': 3, 'bathrooms': 2, 'area_wah': 50,
    'images': [], 'property_owner': 'Naphat',
}
OLD_HOUSE = {**HOUSE, 'id': 'old-house', 'custom_id': 'old', 'project_name': 'บ้านเดิม'}
DOCUMENT = {
    'name': 'projects/test/databases/(default)/documents/properties/new-house',
    'fields': {key: {'integerValue': str(value)} if isinstance(value, int)
               else {'stringValue': value} for key, value in HOUSE.items()
               if isinstance(value, (str, int))},
}


def setup(browser, scenario):
    context = browser.new_context(viewport={'width': 1365, 'height': 900})
    page = context.new_page()
    errors, lookups = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))

    def route_request(route):
        url = route.request.url
        if '/api/public-data' in url:
            houses = [HOUSE] if scenario == 'cached' else [OLD_HOUSE]
            route.fulfill(json={'properties': houses, 'company': None, 'visual': None, 'popup': None})
        elif 'firestore.googleapis.com' in url and ':runQuery' in url:
            lookups.append(route.request.post_data_json)
            if scenario == 'offline':
                route.fulfill(status=503, json={'error': 'unavailable'})
            elif scenario == 'missing':
                route.fulfill(json=[{'readTime': '2026-09-21T00:00:00Z'}])
            else:
                route.fulfill(json=[{'document': DOCUMENT}])
        elif url.startswith(BASE):
            route.continue_()
        else:
            route.abort()

    page.route('**/*', route_request)
    return context, page, errors, lookups


with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)
    for scenario in ['stale', 'cached', 'missing', 'offline']:
        context, page, errors, lookups = setup(browser, scenario)
        page.goto(f'{BASE}/api/share?property={quote(HOUSE["custom_id"], safe="")}')
        page.wait_for_load_state('networkidle')
        if scenario in ['stale', 'cached']:
            expect(page.get_by_role('heading', name=HOUSE['project_name'], exact=True)).to_be_visible()
            expect(page.get_by_text('ไม่พบข้อมูล', exact=True)).to_have_count(0)
            assert bool(lookups) == (scenario == 'stale'), lookups
            if scenario == 'stale':
                # Reloading the share URL must work with the same stale list.
                page.reload()
                expect(page.get_by_role('heading', name=HOUSE['project_name'], exact=True)).to_be_visible()
                output = Path('coverage/property-links.png')
                output.parent.mkdir(exist_ok=True)
                page.screenshot(path=str(output))
        elif scenario == 'missing':
            expect(page.get_by_text('ไม่พบข้อมูล', exact=True)).to_be_visible()
            assert len(lookups) == 2
        else:
            expect(page.get_by_text('โหลดข้อมูลไม่สำเร็จ', exact=True)).to_be_visible()
            expect(page.get_by_text('ไม่พบข้อมูล', exact=True)).to_have_count(0)
            assert 'property=' in page.url
            page.route('**/*:runQuery*', lambda route: route.fulfill(json=[{'document': DOCUMENT}]))
            page.get_by_role('button', name='ตกลง', exact=True).click()
            expect(page.get_by_role('heading', name=HOUSE['project_name'], exact=True)).to_be_visible()
        assert not errors, errors
        print(json.dumps({'scenario': scenario, 'passed': True, 'lookups': len(lookups)}))
        context.close()
    browser.close()
