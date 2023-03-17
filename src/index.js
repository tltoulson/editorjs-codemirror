/* eslint-disable prettier/prettier */
import { IconBrackets } from '@codexteam/icons';
import { basicSetup } from 'codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';

import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { xml } from '@codemirror/lang-xml';

import themeOverrides from './config/themeOverrides';


/**
 * TODO: Readonly field (see Code plugin for example)
 */

/**
 * CodeTool for Editor.js
 *
 * @author Travis Toulson
 * @copyright Travis Toulson 2023
 * @license MIT
 * @version 0.0.1
 */

/* global PasteEvent */

/**
 * Code Tool for the Editor.js allows to include code examples in your articles using Code Mirror.
 */
export default class CodeMirrorTool {
    /**
     * Notify core that read-only mode is supported
     *
     * @returns {boolean}
     */
    static get isReadOnlySupported() {
        return true;
    }

    /**
     * Allow to press Enter inside the CodeTool textarea
     *
     * @returns {boolean}
     * @public
     */
    static get enableLineBreaks() {
        return true;
    }

    /**
     * @typedef {object} CodeData — plugin saved data
     * @property {string} code - previously saved plugin code
     */

    /**
     * Render plugin`s main Element and fill it with saved data
     *
     * @param {object} options - tool constricting options
     * @param {CodeData} options.data — previously saved plugin code
     * @param {object} options.config - user config for Tool
     * @param {object} options.api - Editor.js API
     * @param {boolean} options.readOnly - read only mode flag
     */
    constructor({ data, config, api, readOnly }) {
        this.api = api;
        this.readOnly = readOnly;
        this.selectedLanguage = data.language || 'None';

        this.nodes = {
            holder: null,
            languagePicker: null,
        };

        this.languages = [
            { 'name': 'None', 'extension': []},
            { 'name': 'CSS', 'extension': css },
            { 'name': 'HTML', 'extension': html },
            { 'name': 'JavaScript', 'extension': javascript },
            { 'name': 'JSON', 'extension': json },
            { 'name': 'Markdown', 'extension': markdown },
            { 'name': 'XML', 'extension': xml },
        ];

        this.codeMirrorInstance = null;

        this.nodes.holder = this.drawView(data);
    }

    /**
     * Create Tool's view
     *
     * @returns {HTMLElement}
     * @private
     */
    drawView(data) {
        var wrapper = document.createElement('div'),
            codeEditor = document.createElement('div');

        wrapper.classList.add('cdx-block');

        // Setup CodeMirror Theme
        var theme = new Compartment();
        var language = new Compartment();

        // CodeMirror extension to support handling dom events
        var domEventHandlers = EditorView.domEventHandlers({
            /**
             * pasteHandler
             * Preventd the Paste Event from propagating
             * to EditorJS. This fixes the double paste issue
             * where both CodeMirror and EditorJS attempt
             * to handle the event.
             */
            paste(event, view) {
                event.stopPropagation();
            }
        });

    
        // Setup CodeMirror instance
        var codeMirrorExtensions = [
            basicSetup, 
            language.of(this._getLanguageExtension()), 
            theme.of(oneDark),
            EditorView.theme(themeOverrides),
            domEventHandlers,
            keymap.of([indentWithTab]),
        ];

        if (this.readOnly) {
            codeMirrorExtensions.push(EditorState.readOnly.of(true));
        }

        this.codeMirrorInstance = new EditorView({
            doc: data.code,
            extensions: codeMirrorExtensions,
            parent: codeEditor
        });

        /**
         * Enable keydown handlers
         */
        codeEditor.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'Tab':
                    this.tabHandler(event);
                    break;
            }
        });

        // Setup language picker and options
        var languagePickerWrapper = document.createElement('div');
        languagePickerWrapper.style = 'text-align: right;';

        var languagePicker = document.createElement('select');
        languagePicker.title = 'Language Picker';
        this.nodes.languagePicker = languagePicker;
        
        languagePickerWrapper.appendChild(languagePicker);

        this.languages.forEach(function(language) {
            var option = document.createElement('option');
            option.value = language.name;
            option.text = language.name;

            if (language.name == this.selectedLanguage) {
                option.selected = true;
            }

            languagePicker.appendChild(option);
        }, this);

        var self = this;
        languagePicker.addEventListener('change', function(event) {
            // Update Language
            this.selectedLanguage = event.target.value;
            var selectedLangExtension = self._getLanguageExtension();

            if (selectedLangExtension) {
                self.codeMirrorInstance.dispatch({
                    effects: language.reconfigure(selectedLangExtension),
                });
            }
            else {
                throw 'Selected language not found';
            }
            
        });

        // Append CodeMirror and language selector to DOM Element
        wrapper.appendChild(codeEditor);
        wrapper.appendChild(languagePickerWrapper);

        return wrapper;
    }

    /**
     * Return Tool's view
     *
     * @returns {HTMLDivElement} this.nodes.holder - Code's wrapper
     * @public
     */
    render() {
        return this.nodes.holder;
    }

    /**
     * Extract Tool's data from the view
     *
     * @param {HTMLDivElement} codeWrapper - CodeTool's wrapper, containing textarea with code
     * @returns {CodeData} - saved plugin code
     * @public
     */
    save() {
        return {
            code: this.codeMirrorInstance.state.doc.toString(),
            language: this.nodes.languagePicker.value,
        };
    }

    /**
     *  Used by Editor.js paste handling API.
     *  Provides configuration to handle CODE tag.
     *
     * @static
     * @returns {{tags: string[]}}
     */
    static get pasteConfig() {
        return {
            tags: ['pre', 'code'],
        };
    }

    /**
     * onPaste callback fired from Editor`s core
     *
     * @param {PasteEvent} event - event with pasted content
     */
    onPaste(event) {
        const content = event.detail.data;

        if (this.codeMirrorInstance) {
            this.codeMirrorInstance.dispatch({
                changes: {
                    from: 0,
                    to: this.codeMirrorInstance.state.doc.length,
                    insert: content.textContent,
                }
            });
        }
    }

    /**
     * Get Tool toolbox settings
     * icon - Tool icon's SVG
     * title - title to show in toolbox
     *
     * @returns {{icon: string, title: string}}
     */
    static get toolbox() {
        return {
            icon: IconBrackets,
            title: 'CodeMirror',
        };
    }

    /**
     * Automatic sanitize config
     *
     * @returns {{code: boolean}}
     */
    static get sanitize() {
        return {
            code: true, // Allow HTML tags
        };
    }

    /**
     * TODO: Fix tab handling
     * Handles Tab key pressing (adds/removes indentations)
     *
     * @private
     * @param {KeyboardEvent} event - keydown
     * @returns {void}
     */
    tabHandler(event) {
        /**
         * Prevent editor.js tab handler
         */
        event.stopPropagation();
    }

    _getLanguageExtension() {
        var selectedLanguage = this.languages.find(function(language) {
            return language.name == this.selectedLanguage;
        }, this);

        if (typeof selectedLanguage.extension == 'function') {
            return selectedLanguage.extension();
        }
        else {
            return selectedLanguage.extension;
        }
    }
}