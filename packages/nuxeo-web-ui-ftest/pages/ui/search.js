import Results from './results';
import DocumentPermissions from './browser/document_permissions';

export default class Search extends Results {
  get quickSearchResults() {
    this.waitForVisible('#results #selector a');
    return this.el.elements('#results #selector a');
  }

  get saveSearchAsButton() {
    driver.waitForVisible('#actions paper-button');
    return driver.elementByTextContent('#actions paper-button', 'Save As');
  }

  get confirmSaveSearchButton() {
    driver.waitForVisible('#saveDialog paper-button.primary');
    return driver.element('#saveDialog paper-button.primary');
  }

  get menuButton() {
    return this.el.element('#menuButton');
  }

  get savedSearchActionButton() {
    return driver.element('nuxeo-saved-search-actions paper-icon-button');
  }

  get shareAction() {
    driver.waitForVisible('nuxeo-saved-search-actions paper-item');
    return driver.elementByTextContent('nuxeo-saved-search-actions paper-item', 'Share');
  }

  get permissionsView() {
    return new DocumentPermissions(`${this._selector} nuxeo-document-permissions`);
  }

  getSavedSearch(savedSearchName) {
    driver.waitUntil(() => {
      const els = driver.elements(`${this._selector} #actionsDropdown paper-item`).value;
      return els.length > 1;
    });
    return this.el.elementByTextContent('#actionsDropdown paper-item', savedSearchName);
  }

  enterInput(text) {
    return driver.keys(text);
  }

  getField(field) {
    driver.waitForExist(this._selector);
    driver.waitForVisible(this._selector);
    return this.el.element(`[name="${field}"]`);
  }

  getFieldValue(field) {
    const fieldEl = this.getField(field);
    fieldEl.waitForVisible();
    return fixtures.layouts.getValue(fieldEl);
  }

  setFieldValue(field, value) {
    const fieldEl = this.getField(field);
    fieldEl.waitForVisible();
    fieldEl.scrollIntoView();
    return fixtures.layouts.setValue(fieldEl, value);
  }

  search(searchType, searchTerm) {
    if (searchType === 'fulltext') {
      this.el.element('#searchInput .input-element input').waitForVisible();
      this.el.element('#searchInput .input-element input').setValue(searchTerm);
      driver.keys('Enter');
    } else {
      this.setFieldValue(searchType, searchTerm);
    }
  }

  quickSearchResultsCount() {
    const rows = this.el.element('#results #selector').elements('a.item');
    return rows.value.filter((result) => result.getAttribute('hidden') === null).length;
  }
}
