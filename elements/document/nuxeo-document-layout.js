/**
@license
(C) Copyright Nuxeo Corp. (http://nuxeo.com/)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import '@polymer/polymer/polymer-legacy.js';

import '@nuxeo/nuxeo-ui-elements/nuxeo-layout.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { I18nBehavior } from '@nuxeo/nuxeo-ui-elements/nuxeo-i18n-behavior.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

/**
`nuxeo-document-layout`
@group Nuxeo UI
@element nuxeo-document-layout
*/
Polymer({
  _template: html`
    <style include="nuxeo-styles">
      #error {
        margin-bottom: 8px;
      }

      .error {
        border-left: 4px solid var(--paper-input-container-invalid-color, red);
        color: var(--paper-input-container-invalid-color, red);
        padding-left: 8px;
      }
    </style>
    <div id="error">
      <template is="dom-repeat" items="[[_errorMessages]]">
        <span class="error">[[item]]</span>
      </template>
    </div>
    <nuxeo-layout
      id="layout"
      href="[[_href]]"
      model="[[_model]]"
      error="[[i18n('documentView.layoutNotFound', document.type)]]"
      on-element-changed="_elementChanged"
    >
    </nuxeo-layout>
  `,

  is: 'nuxeo-document-layout',
  behaviors: [I18nBehavior],
  importMeta: import.meta,
  properties: {
    document: {
      type: Object,
      notify: true,
    },
    layout: {
      type: String,
      value: 'view',
    },
    _model: {
      type: Object,
      notify: true,
      value: {},
    },
    _href: {
      type: String,
      notify: true,
    },
    _errorMessages: {
      type: Array,
      value: [],
    },
  },

  observers: ['_loadLayout(document, layout)'],

  get element() {
    return this.$.layout.element;
  },

  applyAutoFocus() {
    const focusableElement = this._getFocusableElement(this.element);
    if (focusableElement) {
      focusableElement.focus();
    }
  },

  validate() {
    return this.$.layout.validate();
  },

  _loadLayout(document, layout) {
    this._resetValidationErrors();
    if (document) {
      if (!this.previousDocument || document.uid !== this.previousDocument.uid) {
        this._href = null; // force layout restamp
      }
      if (!this.previousDocument || document.type === this.previousDocument.type) {
        this._model = { document };
      }
      const doctype = document.type.toLowerCase();
      const name = ['nuxeo', doctype, layout, 'layout'].join('-');
      this._href = this.resolveUrl(`${doctype}/${name}.html`);
    } else if (document === undefined) {
      // XXX undefined is used to notify a cancel to inner elements
      this._model = { document };
    }
    this.previousDocument = document;
  },

  _elementChanged() {
    this._model = { document: this.document };
    // forward document path change events
    if (this.element) {
      this.element.addEventListener('document-changed', (e) => {
        this.notifyPath(e.detail.path, e.detail.value);
      });
    }
    afterNextRender(this, () => {
      // fire the `document-layout-changed` event only after flush
      this.fire('document-layout-changed', {
        element: this.element,
        layout: this.layout,
      });
      this.applyAutoFocus();
    });
  },

  _getBoundElements(property) {
    return this.$.layout._getBoundElements(property);
  },

  _getFocusableElement(parent) {
    if (parent && parent.shadowRoot && !parent.shadowRoot.activeElement) {
      const nodes = Array.from(parent.shadowRoot.querySelectorAll('*')).filter((node) => {
        const style = window.getComputedStyle(node);
        return !node.disabled && style.display !== 'none' && style.visibility !== 'hidden';
      });
      let focusableElement = nodes.find((node) => node.autofocus);
      if (focusableElement) {
        return focusableElement;
      }

      nodes
        .filter((node) => node.shadowRoot)
        .forEach((node) => {
          focusableElement = this._getFocusableElement(node);
          if (focusableElement) {
            return focusableElement;
          }
        });
    }
  },

  reportValidation(validationReport) {
    this._resetValidationErrors();
    validationReport.violations.reverse().forEach((violation) => {
      this.invalid = true;
      if (violation.path) {
        violation.path.forEach((p) => {
          const widgets = this._getBoundElements(`document.properties.${p.field_name}`);
          if (widgets) {
            const msg = this.i18n(violation.messageKey, violation.invalid_value, p.field_name);
            if (msg === violation.messageKey && violation.constraint && violation.constraint.name) {
              this._addValidationError(
                this.i18n(
                  `label.schema.constraint.violation.${violation.constraint.name}`,
                  violation.invalid_value,
                  p.field_name,
                  ...Object.values(violation.constraint.parameters),
                ),
              );
            } else {
              this._addValidationError(msg);
            }
            Object.values(widgets).forEach((widget) => {
              // we can at least flag the widget `invalid`
              widget.invalid = true;
            });
          } else {
            this._addValidationError(this.i18n(violation.messageKey, violation.invalid_value, p.field_name));
          }
        });
      } else {
        this._addValidationError(this.i18n(violation.messageKey));
      }
    });
  },

  _addValidationError(message) {
    this._errorMessages.push(message);
    this.$.error.scrollIntoView();
    this.$.error.focus();
  },

  _resetValidationErrors() {
    this._errorMessages = [];
  },
});
