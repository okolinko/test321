// Copyright 2012 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {E as EventTracker, a as assertInstanceof, b as assert, h as hasKeyModifiers, i as isRTL, g as getDeepActiveElement, F as FocusOutlineManager, A as AnnotationBrushType, r as record, U as UserAction, c as assertNotReached, d as hexToColor, e as colorToHex, f as blendHighlighterColorValue, j as getCss$r, P as PluginController, k as PluginControllerEventType, S as SaveRequestType, l as PromiseResolver, m as getCss$s, n as FormFieldFocusType, o as FittingType, p as getCss$t, q as PdfViewerBaseElement, s as shouldIgnoreKeyEvents, t as hasCtrlModifier, u as hasCtrlModifierOnly, v as recordEnumeration, w as convertDocumentDimensionsMessage, x as listenOnce, y as convertLoadProgressMessage, z as convertFormFocusChangeMessage} from "./shared.rollup.js";
export {C as CrIconButtonElement, G as GestureDetector, O as OpenPdfParamsParser, J as PAGE_SHADOW, H as SwipeDetector, I as SwipeDirection, V as ViewMode, K as Viewport, Z as ZoomManager, B as recordFitTo, D as resetForTesting} from "./shared.rollup.js";
import {css, html, nothing, CrLitElement} from "chrome://resources/lit/v3_0/lit.rollup.js";
export {BrowserApi, ZoomBehavior} from "./browser_api.js";
import {loadTimeData} from "chrome://resources/js/load_time_data.js";
import {LoadState, deserializeKeyEvent} from "./pdf_scripting_api.js";
const ACTIVE_CLASS = "focus-row-active";
class FocusRow {
    root;
    delegate;
    eventTracker = new EventTracker;
    boundary_;
    constructor(root, boundary, delegate) {
        this.root = root;
        this.boundary_ = boundary || document.documentElement;
        this.delegate = delegate
    }
    static isFocusable(element) {
        if (!element || element.disabled) {
            return false
        }
        let current = element;
        while (true) {
            assertInstanceof(current, Element);
            const style = window.getComputedStyle(current);
            if (style.visibility === "hidden" || style.display === "none") {
                return false
            }
            const parent = current.parentNode;
            if (!parent) {
                return false
            }
            if (parent === current.ownerDocument || parent instanceof DocumentFragment) {
                return true
            }
            current = parent
        }
    }
    static getFocusableElement(element) {
        const withFocusable = element;
        if (withFocusable.getFocusableElement) {
            return withFocusable.getFocusableElement()
        }
        return element
    }
    addItem(type, selectorOrElement) {
        assert(type);
        let element;
        if (typeof selectorOrElement === "string") {
            element = this.root.querySelector(selectorOrElement)
        } else {
            element = selectorOrElement
        }
        if (!element) {
            return false
        }
        element.setAttribute("focus-type", type);
        element.tabIndex = this.isActive() ? 0 : -1;
        this.eventTracker.add(element, "blur", this.onBlur_.bind(this));
        this.eventTracker.add(element, "focus", this.onFocus_.bind(this));
        this.eventTracker.add(element, "keydown", this.onKeydown_.bind(this));
        this.eventTracker.add(element, "mousedown", this.onMousedown_.bind(this));
        return true
    }
    destroy() {
        this.eventTracker.removeAll()
    }
    getCustomEquivalent(_sampleElement) {
        const focusable = this.getFirstFocusable();
        assert(focusable);
        return focusable
    }
    getElements() {
        return Array.from(this.root.querySelectorAll("[focus-type]")).map(FocusRow.getFocusableElement)
    }
    getEquivalentElement(sampleElement) {
        if (this.getFocusableElements().indexOf(sampleElement) >= 0) {
            return sampleElement
        }
        const sampleFocusType = this.getTypeForElement(sampleElement);
        if (sampleFocusType) {
            const sameType = this.getFirstFocusable(sampleFocusType);
            if (sameType) {
                return sameType
            }
        }
        return this.getCustomEquivalent(sampleElement)
    }
    getFirstFocusable(type) {
        const element = this.getFocusableElements().find((el => !type || el.getAttribute("focus-type") === type));
        return element || null
    }
    getFocusableElements() {
        return this.getElements().filter(FocusRow.isFocusable)
    }
    getTypeForElement(element) {
        return element.getAttribute("focus-type") || ""
    }
    isActive() {
        return this.root.classList.contains(ACTIVE_CLASS)
    }
    makeActive(active) {
        if (active === this.isActive()) {
            return
        }
        this.getElements().forEach((function(element) {
            element.tabIndex = active ? 0 : -1
        }
        ));
        this.root.classList.toggle(ACTIVE_CLASS, active)
    }
    onBlur_(e) {
        if (!this.boundary_.contains(e.relatedTarget)) {
            return
        }
        const currentTarget = e.currentTarget;
        if (this.getFocusableElements().indexOf(currentTarget) >= 0) {
            this.makeActive(false)
        }
    }
    onFocus_(e) {
        if (this.delegate) {
            this.delegate.onFocus(this, e)
        }
    }
    onMousedown_(e) {
        if (e.button) {
            return
        }
        const target = e.currentTarget;
        if (!target.disabled) {
            target.tabIndex = 0
        }
    }
    onKeydown_(e) {
        const elements = this.getFocusableElements();
        const currentElement = FocusRow.getFocusableElement(e.currentTarget);
        const elementIndex = elements.indexOf(currentElement);
        assert(elementIndex >= 0);
        if (this.delegate && this.delegate.onKeydown(this, e)) {
            return
        }
        const isShiftTab = !e.altKey && !e.ctrlKey && !e.metaKey && e.shiftKey && e.key === "Tab";
        if (hasKeyModifiers(e) && !isShiftTab) {
            return
        }
        let index = -1;
        let shouldStopPropagation = true;
        if (isShiftTab) {
            index = elementIndex - 1;
            if (index < 0) {
                return
            }
        } else if (e.key === "ArrowLeft") {
            index = elementIndex + (isRTL() ? 1 : -1)
        } else if (e.key === "ArrowRight") {
            index = elementIndex + (isRTL() ? -1 : 1)
        } else if (e.key === "Home") {
            index = 0
        } else if (e.key === "End") {
            index = elements.length - 1
        } else {
            shouldStopPropagation = false
        }
        const elementToFocus = elements[index];
        if (elementToFocus) {
            this.getEquivalentElement(elementToFocus).focus();
            e.preventDefault()
        }
        if (shouldStopPropagation) {
            e.stopPropagation()
        }
    }
}
const isMac = /Mac/.test(navigator.platform);
const isWindows = /Win/.test(navigator.platform);
const isIOS = /CriOS/.test(navigator.userAgent);
let hideInk = false;
assert(!isIOS, "pointerdown doesn't work on iOS");
document.addEventListener("pointerdown", (function() {
    hideInk = true
}
), true);
document.addEventListener("keydown", (function() {
    hideInk = false
}
), true);
function focusWithoutInk(toFocus) {
    if (!("noink"in toFocus) || !hideInk) {
        toFocus.focus();
        return
    }
    const toFocusWithNoInk = toFocus;
    assert(document === toFocusWithNoInk.ownerDocument);
    const {noink: noink} = toFocusWithNoInk;
    toFocusWithNoInk.noink = true;
    toFocusWithNoInk.focus();
    toFocusWithNoInk.noink = noink
}
let instance$t = null;
function getCss$q() {
    return instance$t || (instance$t = [...[], css`:host{--cr-hairline:1px solid var(--color-menu-separator,
      var(--cr-fallback-color-divider));--cr-action-menu-disabled-item-color:var(--color-menu-item-foreground-disabled,
          var(--cr-fallback-color-disabled-foreground));--cr-action-menu-disabled-item-opacity:1;--cr-menu-background-color:var(--color-menu-background,
      var(--cr-fallback-color-surface));--cr-menu-background-focus-color:var(--cr-hover-background-color);--cr-menu-shadow:var(--cr-elevation-2);--cr-primary-text-color:var(--color-menu-item-foreground,
      var(--cr-fallback-color-on-surface))}:host dialog{background-color:var(--cr-menu-background-color);border:none;border-radius:var(--cr-menu-border-radius,4px);box-shadow:var(--cr-menu-shadow);margin:0;min-width:128px;outline:0;padding:0;position:absolute}@media (forced-colors:active){:host dialog{border:var(--cr-border-hcm)}}:host dialog::backdrop{background-color:transparent}:host ::slotted(.dropdown-item){-webkit-tap-highlight-color:transparent;background:0 0;border:none;border-radius:0;box-sizing:border-box;color:var(--cr-primary-text-color);font:inherit;min-height:32px;padding:8px 24px;text-align:start;user-select:none;width:100%}:host ::slotted(.dropdown-item:not([hidden])){align-items:center;display:flex}:host ::slotted(.dropdown-item[disabled]){color:var(--cr-action-menu-disabled-item-color,var(--cr-primary-text-color));opacity:var(--cr-action-menu-disabled-item-opacity,.65)}:host ::slotted(.dropdown-item:not([disabled])){cursor:pointer}:host ::slotted(.dropdown-item:focus){background-color:var(--cr-menu-background-focus-color);outline:0}@media (forced-colors:active){:host ::slotted(.dropdown-item:focus){outline:var(--cr-focus-outline-hcm)}}.item-wrapper{outline:0;padding:var(--cr-action-menu-padding,8px 0)}`])
}
function getHtml$m() {
    return html`
<dialog id="dialog" part="dialog" @close="${this.onNativeDialogClose_}"
    role="application"
    aria-roledescription="${this.roleDescription || nothing}">
  <div id="wrapper" class="item-wrapper" role="menu" tabindex="-1"
      aria-label="${this.accessibilityLabel || nothing}">
    <slot id="contentNode" @slotchange="${this.onSlotchange_}"></slot>
  </div>
</dialog>`
}
var AnchorAlignment;
(function(AnchorAlignment) {
    AnchorAlignment[AnchorAlignment["BEFORE_START"] = -2] = "BEFORE_START";
    AnchorAlignment[AnchorAlignment["AFTER_START"] = -1] = "AFTER_START";
    AnchorAlignment[AnchorAlignment["CENTER"] = 0] = "CENTER";
    AnchorAlignment[AnchorAlignment["BEFORE_END"] = 1] = "BEFORE_END";
    AnchorAlignment[AnchorAlignment["AFTER_END"] = 2] = "AFTER_END"
}
)(AnchorAlignment || (AnchorAlignment = {}));
const DROPDOWN_ITEM_CLASS = "dropdown-item";
const SELECTABLE_DROPDOWN_ITEM_QUERY = `.${DROPDOWN_ITEM_CLASS}:not([hidden]):not([disabled])`;
const AFTER_END_OFFSET = 10;
function getStartPointWithAnchor(start, end, menuLength, anchorAlignment, min, max) {
    let startPoint = 0;
    switch (anchorAlignment) {
    case AnchorAlignment.BEFORE_START:
        startPoint = start - menuLength;
        break;
    case AnchorAlignment.AFTER_START:
        startPoint = start;
        break;
    case AnchorAlignment.CENTER:
        startPoint = (start + end - menuLength) / 2;
        break;
    case AnchorAlignment.BEFORE_END:
        startPoint = end - menuLength;
        break;
    case AnchorAlignment.AFTER_END:
        startPoint = end;
        break
    }
    if (startPoint + menuLength > max) {
        startPoint = end - menuLength
    }
    if (startPoint < min) {
        startPoint = start
    }
    startPoint = Math.max(min, Math.min(startPoint, max - menuLength));
    return startPoint
}
function getDefaultShowConfig() {
    return {
        top: 0,
        left: 0,
        height: 0,
        width: 0,
        anchorAlignmentX: AnchorAlignment.AFTER_START,
        anchorAlignmentY: AnchorAlignment.AFTER_START,
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0
    }
}
class CrActionMenuElement extends CrLitElement {
    constructor() {
        super(...arguments);
        this.autoReposition = false;
        this.open = false;
        this.boundClose_ = null;
        this.resizeObserver_ = null;
        this.hasMousemoveListener_ = false;
        this.anchorElement_ = null;
        this.lastConfig_ = null
    }
    static get is() {
        return "cr-action-menu"
    }
    static get styles() {
        return getCss$q()
    }
    render() {
        return getHtml$m.bind(this)()
    }
    static get properties() {
        return {
            accessibilityLabel: {
                type: String
            },
            autoReposition: {
                type: Boolean
            },
            open: {
                type: Boolean,
                notify: true
            },
            roleDescription: {
                type: String
            }
        }
    }
    firstUpdated() {
        this.addEventListener("keydown", this.onKeyDown_.bind(this));
        this.addEventListener("mouseover", this.onMouseover_);
        this.addEventListener("click", this.onClick_)
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeListeners_()
    }
    getDialog() {
        return this.$.dialog
    }
    removeListeners_() {
        window.removeEventListener("resize", this.boundClose_);
        window.removeEventListener("popstate", this.boundClose_);
        if (this.resizeObserver_) {
            this.resizeObserver_.disconnect();
            this.resizeObserver_ = null
        }
    }
    onNativeDialogClose_(e) {
        if (e.target !== this.$.dialog) {
            return
        }
        this.fire("close")
    }
    onClick_(e) {
        if (e.target === this) {
            this.close();
            e.stopPropagation()
        }
    }
    onKeyDown_(e) {
        e.stopPropagation();
        if (e.key === "Tab" || e.key === "Escape") {
            this.close();
            if (e.key === "Tab") {
                this.fire("tabkeyclose", {
                    shiftKey: e.shiftKey
                })
            }
            e.preventDefault();
            return
        }
        if (e.key !== "Enter" && e.key !== "ArrowUp" && e.key !== "ArrowDown") {
            return
        }
        const options = Array.from(this.querySelectorAll(SELECTABLE_DROPDOWN_ITEM_QUERY));
        if (options.length === 0) {
            return
        }
        const focused = getDeepActiveElement();
        const index = options.findIndex((option => FocusRow.getFocusableElement(option) === focused));
        if (e.key === "Enter") {
            if (index !== -1) {
                return
            }
            if (isWindows || isMac) {
                this.close();
                e.preventDefault();
                return
            }
        }
        e.preventDefault();
        this.updateFocus_(options, index, e.key !== "ArrowUp");
        if (!this.hasMousemoveListener_) {
            this.hasMousemoveListener_ = true;
            this.addEventListener("mousemove", (e => {
                this.onMouseover_(e);
                this.hasMousemoveListener_ = false
            }
            ), {
                once: true
            })
        }
    }
    onMouseover_(e) {
        const item = e.composedPath().find((el => el.matches && el.matches(SELECTABLE_DROPDOWN_ITEM_QUERY)));
        (item || this.$.wrapper).focus()
    }
    updateFocus_(options, focusedIndex, next) {
        const numOptions = options.length;
        assert(numOptions > 0);
        let index;
        if (focusedIndex === -1) {
            index = next ? 0 : numOptions - 1
        } else {
            const delta = next ? 1 : -1;
            index = (numOptions + focusedIndex + delta) % numOptions
        }
        options[index].focus()
    }
    close() {
        if (!this.open) {
            return
        }
        this.removeListeners_();
        this.$.dialog.close();
        this.open = false;
        if (this.anchorElement_) {
            assert(this.anchorElement_);
            focusWithoutInk(this.anchorElement_);
            this.anchorElement_ = null
        }
        if (this.lastConfig_) {
            this.lastConfig_ = null
        }
    }
    showAt(anchorElement, config) {
        this.anchorElement_ = anchorElement;
        this.anchorElement_.scrollIntoViewIfNeeded();
        const rect = this.anchorElement_.getBoundingClientRect();
        let height = rect.height;
        if (config && !config.noOffset && config.anchorAlignmentY === AnchorAlignment.AFTER_END) {
            height -= AFTER_END_OFFSET
        }
        this.showAtPosition(Object.assign({
            top: rect.top,
            left: rect.left,
            height: height,
            width: rect.width,
            anchorAlignmentX: AnchorAlignment.BEFORE_END
        }, config));
        this.$.wrapper.focus()
    }
    showAtPosition(config) {
        const doc = document.scrollingElement;
        const scrollLeft = doc.scrollLeft;
        const scrollTop = doc.scrollTop;
        this.resetStyle_();
        this.$.dialog.showModal();
        this.open = true;
        config.top += scrollTop;
        config.left += scrollLeft;
        this.positionDialog_(Object.assign({
            minX: scrollLeft,
            minY: scrollTop,
            maxX: scrollLeft + doc.clientWidth,
            maxY: scrollTop + doc.clientHeight
        }, config));
        doc.scrollTop = scrollTop;
        doc.scrollLeft = scrollLeft;
        this.addListeners_();
        const openedByKey = FocusOutlineManager.forDocument(document).visible;
        if (openedByKey) {
            const firstSelectableItem = this.querySelector(SELECTABLE_DROPDOWN_ITEM_QUERY);
            if (firstSelectableItem) {
                requestAnimationFrame(( () => {
                    firstSelectableItem.focus()
                }
                ))
            }
        }
    }
    resetStyle_() {
        this.$.dialog.style.left = "";
        this.$.dialog.style.right = "";
        this.$.dialog.style.top = "0"
    }
    positionDialog_(config) {
        this.lastConfig_ = config;
        const c = Object.assign(getDefaultShowConfig(), config);
        const top = c.top;
        const left = c.left;
        const bottom = top + c.height;
        const right = left + c.width;
        const rtl = getComputedStyle(this).direction === "rtl";
        if (rtl) {
            c.anchorAlignmentX *= -1
        }
        const offsetWidth = this.$.dialog.offsetWidth;
        const menuLeft = getStartPointWithAnchor(left, right, offsetWidth, c.anchorAlignmentX, c.minX, c.maxX);
        if (rtl) {
            const menuRight = document.scrollingElement.clientWidth - menuLeft - offsetWidth;
            this.$.dialog.style.right = menuRight + "px"
        } else {
            this.$.dialog.style.left = menuLeft + "px"
        }
        const menuTop = getStartPointWithAnchor(top, bottom, this.$.dialog.offsetHeight, c.anchorAlignmentY, c.minY, c.maxY);
        this.$.dialog.style.top = menuTop + "px"
    }
    onSlotchange_() {
        for (const node of this.$.contentNode.assignedElements({
            flatten: true
        })) {
            if (node.classList.contains(DROPDOWN_ITEM_CLASS) && !node.getAttribute("role")) {
                node.setAttribute("role", "menuitem")
            }
        }
    }
    addListeners_() {
        this.boundClose_ = this.boundClose_ || ( () => {
            if (this.$.dialog.open) {
                this.close()
            }
        }
        );
        window.addEventListener("resize", this.boundClose_);
        window.addEventListener("popstate", this.boundClose_);
        if (this.autoReposition) {
            this.resizeObserver_ = new ResizeObserver(( () => {
                if (this.lastConfig_) {
                    this.positionDialog_(this.lastConfig_);
                    this.fire("cr-action-menu-repositioned")
                }
            }
            ));
            this.resizeObserver_.observe(this.$.dialog)
        }
    }
}
customElements.define(CrActionMenuElement.is, CrActionMenuElement);
class BeforeUnloadProxyImpl {
    preventDefault(event) {
        event.preventDefault()
    }
    static getInstance() {
        return instance$s || (instance$s = new BeforeUnloadProxyImpl)
    }
    static setInstance(obj) {
        instance$s = obj
    }
}
let instance$s = null;
let instance$r = null;
function getCss$p() {
    return instance$r || (instance$r = [...[], css`:host,div{display:flex;gap:var(--ink-brush-button-gap,16px);justify-content:center}cr-icon-button{--cr-icon-button-fill-color:var(--viewer-icon-ink-fill-color);--cr-icon-button-size:var(--ink-brush-button-size, 48px)}cr-icon-button[data-selected=true]{--cr-icon-button-fill-color:var(--viewer-icon-ink-selected-fill-color);background-color:var(--viewer-icon-ink-selected-background-color)}`])
}
function getHtml$l() {
    return html`
    <div role="listbox">
      ${BRUSH_TYPES.map((brush => html`
        <cr-icon-button id="${brush}" role="option"
            iron-icon="${this.getIcon_(brush)}"
            data-brush="${brush}"
            data-selected="${this.isCurrentType_(brush)}"
            aria-selected="${this.isCurrentType_(brush)}"
            aria-label="${this.getLabel_(brush)}"
            title="${this.getLabel_(brush)}"
            @click="${this.onBrushClick_}">
        </cr-icon-button>`))}
    </div>
  `
}
const BRUSH_TYPES = [AnnotationBrushType.PEN, AnnotationBrushType.HIGHLIGHTER, AnnotationBrushType.ERASER];
class InkBrushSelectorElement extends CrLitElement {
    constructor() {
        super(...arguments);
        this.currentType = AnnotationBrushType.PEN
    }
    static get is() {
        return "ink-brush-selector"
    }
    static get styles() {
        return getCss$p()
    }
    render() {
        return getHtml$l.bind(this)()
    }
    static get properties() {
        return {
            currentType: {
                notify: true,
                type: String
            }
        }
    }
    onBrushClick_(e) {
        const targetElement = e.currentTarget;
        const newType = targetElement.dataset["brush"];
        if (this.currentType === newType) {
            return
        }
        this.currentType = newType;
        switch (newType) {
        case AnnotationBrushType.ERASER:
            record(UserAction.SELECT_INK2_BRUSH_ERASER);
            break;
        case AnnotationBrushType.HIGHLIGHTER:
            record(UserAction.SELECT_INK2_BRUSH_HIGHLIGHTER);
            break;
        case AnnotationBrushType.PEN:
            record(UserAction.SELECT_INK2_BRUSH_PEN);
            break
        }
    }
    getIcon_(type) {
        const isCurrentType = this.isCurrentType_(type);
        switch (type) {
        case AnnotationBrushType.ERASER:
            return isCurrentType ? "pdf:ink-eraser-fill" : "pdf:ink-eraser";
        case AnnotationBrushType.HIGHLIGHTER:
            return isCurrentType ? "pdf:ink-highlighter-fill" : "pdf:ink-highlighter";
        case AnnotationBrushType.PEN:
            return isCurrentType ? "pdf:ink-pen-fill" : "pdf:ink-pen"
        }
    }
    getLabel_(type) {
        switch (type) {
        case AnnotationBrushType.ERASER:
            return loadTimeData.getString("annotationEraser");
        case AnnotationBrushType.HIGHLIGHTER:
            return loadTimeData.getString("annotationHighlighter");
        case AnnotationBrushType.PEN:
            return loadTimeData.getString("annotationPen")
        }
    }
    isCurrentType_(type) {
        return this.currentType === type
    }
}
customElements.define(InkBrushSelectorElement.is, InkBrushSelectorElement);
function sanitizeInnerHtmlInternal(rawString, opts) {
    opts = opts || {};
    const html = parseHtmlSubset(`<b>${rawString}</b>`, opts.tags, opts.attrs).firstElementChild;
    return html.innerHTML
}
let sanitizedPolicy = null;
function sanitizeInnerHtml(rawString, opts) {
    assert(window.trustedTypes);
    if (sanitizedPolicy === null) {
        sanitizedPolicy = window.trustedTypes.createPolicy("sanitize-inner-html", {
            createHTML: sanitizeInnerHtmlInternal,
            createScript: () => assertNotReached(),
            createScriptURL: () => assertNotReached()
        })
    }
    return sanitizedPolicy.createHTML(rawString, opts)
}
const allowAttribute = (_node, _value) => true;
const allowedAttributes = new Map([["href", (node, value) => node.tagName === "A" && (value.startsWith("chrome://") || value.startsWith("https://") || value === "#")], ["target", (node, value) => node.tagName === "A" && value === "_blank"]]);
const allowedOptionalAttributes = new Map([["class", allowAttribute], ["id", allowAttribute], ["is", (_node, value) => value === "action-link" || value === ""], ["role", (_node, value) => value === "link"], ["src", (node, value) => node.tagName === "IMG" && value.startsWith("chrome://")], ["tabindex", allowAttribute], ["aria-description", allowAttribute], ["aria-hidden", allowAttribute], ["aria-label", allowAttribute], ["aria-labelledby", allowAttribute]]);
const allowedTags = new Set(["A", "B", "I", "BR", "DIV", "EM", "KBD", "P", "PRE", "SPAN", "STRONG"]);
const allowedOptionalTags = new Set(["IMG", "LI", "UL"]);
let unsanitizedPolicy;
function mergeTags(optTags) {
    const clone = new Set(allowedTags);
    optTags.forEach((str => {
        const tag = str.toUpperCase();
        if (allowedOptionalTags.has(tag)) {
            clone.add(tag)
        }
    }
    ));
    return clone
}
function mergeAttrs(optAttrs) {
    const clone = new Map(allowedAttributes);
    optAttrs.forEach((key => {
        if (allowedOptionalAttributes.has(key)) {
            clone.set(key, allowedOptionalAttributes.get(key))
        }
    }
    ));
    return clone
}
function walk(n, f) {
    f(n);
    for (let i = 0; i < n.childNodes.length; i++) {
        walk(n.childNodes[i], f)
    }
}
function assertElement(tags, node) {
    if (!tags.has(node.tagName)) {
        throw Error(node.tagName + " is not supported")
    }
}
function assertAttribute(attrs, attrNode, node) {
    const n = attrNode.nodeName;
    const v = attrNode.nodeValue || "";
    if (!attrs.has(n) || !attrs.get(n)(node, v)) {
        throw Error(node.tagName + "[" + n + '="' + v + '"] is not supported')
    }
}
function parseHtmlSubset(s, extraTags, extraAttrs) {
    const tags = extraTags ? mergeTags(extraTags) : allowedTags;
    const attrs = extraAttrs ? mergeAttrs(extraAttrs) : allowedAttributes;
    const doc = document.implementation.createHTMLDocument("");
    const r = doc.createRange();
    r.selectNode(doc.body);
    if (window.trustedTypes) {
        if (!unsanitizedPolicy) {
            unsanitizedPolicy = window.trustedTypes.createPolicy("parse-html-subset", {
                createHTML: untrustedHTML => untrustedHTML,
                createScript: () => assertNotReached(),
                createScriptURL: () => assertNotReached()
            })
        }
        s = unsanitizedPolicy.createHTML(s)
    }
    const df = r.createContextualFragment(s);
    walk(df, (function(node) {
        switch (node.nodeType) {
        case Node.ELEMENT_NODE:
            assertElement(tags, node);
            const nodeAttrs = node.attributes;
            for (let i = 0; i < nodeAttrs.length; ++i) {
                assertAttribute(attrs, nodeAttrs[i], node)
            }
            break;
        case Node.COMMENT_NODE:
        case Node.DOCUMENT_FRAGMENT_NODE:
        case Node.TEXT_NODE:
            break;
        default:
            throw Error("Node type " + node.nodeType + " is not supported")
        }
    }
    ));
    return df
}
const I18nMixinLit = superClass => {
    class I18nMixinLit extends superClass {
        i18nRaw_(id, ...varArgs) {
            return varArgs.length === 0 ? loadTimeData.getString(id) : loadTimeData.getStringF(id, ...varArgs)
        }
        i18n(id, ...varArgs) {
            const rawString = this.i18nRaw_(id, ...varArgs);
            return parseHtmlSubset(`<b>${rawString}</b>`).firstChild.textContent
        }
        i18nAdvanced(id, opts) {
            opts = opts || {};
            const rawString = this.i18nRaw_(id, ...opts.substitutions || []);
            return sanitizeInnerHtml(rawString, opts)
        }
        i18nDynamic(_locale, id, ...varArgs) {
            return this.i18n(id, ...varArgs)
        }
        i18nRecursive(locale, id, ...varArgs) {
            let args = varArgs;
            if (args.length > 0) {
                args = args.map((str => this.i18nExists(str) ? loadTimeData.getString(str) : str))
            }
            return this.i18nDynamic(locale, id, ...args)
        }
        i18nExists(id) {
            return loadTimeData.valueExists(id)
        }
    }
    return I18nMixinLit
}
;
let instance$q = null;
function getCss$o() {
    return instance$q || (instance$q = [...[], css`cr-icon-button{--cr-icon-button-fill-color:var(--pdf-toolbar-text-color);--cr-icon-button-focus-outline-color:var(--google-grey-500);margin:0}cr-icon-button:hover{background:rgba(255,255,255,.08);border-radius:50%}cr-action-menu,viewer-bookmark{--cr-menu-background-color:var(--google-grey-900);--cr-menu-shadow:rgba(0, 0, 0, .3) 0 1px 2px 0,rgba(0, 0, 0, .15) 0 3px 6px 2px;--cr-primary-text-color:var(--google-grey-200);--cr-menu-background-focus-color:var(--google-grey-700);--cr-separator-line:var(--cr-separator-height) solid rgba(255, 255, 255, .1);--cr-action-menu-disabled-item-color:var(--cr-primary-text-color);--cr-action-menu-disabled-item-opacity:var(--cr-disabled-opacity)}`])
}
let instance$p = null;
function getCss$n() {
    return instance$p || (instance$p = [...[getCss$o()], css`:host{display:inline-block}div{display:grid;grid-template-columns:repeat(5,1fr);justify-content:center}.color-item{align-items:center;cursor:pointer;display:flex;height:48px;justify-content:center;width:48px}.color-chip{appearance:none;background:var(--item-color,#ff00ff);border:1px solid var(--viewer-icon-ink-background-color);border-radius:50%;cursor:pointer;margin:0;height:24px;width:24px}.color-chip[checked]{height:36px;width:36px}`])
}
function getHtml$k() {
    return html`
    <div @keydown="${this.onColorKeydown_}">
      ${this.getCurrentBrushColors_().map(( (item, index) => html`
        <label class="color-item">
          <input type="radio" class="color-chip" data-index="${index}"
              name="${this.getColorName_()}" .value="${item.color}"
              .style="--item-color: ${this.getVisibleColor_(item.color)}"
              aria-label="${this.i18n(item.label)}"
              title="${this.i18n(item.label)}"
              @click="${this.onColorClick_}"
              ?checked="${this.isCurrentColor_(item.color)}">
        </label>`))}
    </div>
  `
}
const NUM_OPTION_COLUMNS = 5;
const HIGHLIGHTER_COLORS = [{
    label: "ink2BrushColorLightRed",
    color: "#f28b82"
}, {
    label: "ink2BrushColorLightYellow",
    color: "#fdd663"
}, {
    label: "annotationColorLightGreen",
    color: "#34a853"
}, {
    label: "annotationColorLightBlue",
    color: "#4285f4"
}, {
    label: "annotationColorLightOrange",
    color: "#ffae80"
}, {
    label: "annotationColorRed",
    color: "#d93025"
}, {
    label: "annotationColorYellow",
    color: "#ddf300"
}, {
    label: "annotationColorGreen",
    color: "#25e387"
}, {
    label: "annotationColorBlue",
    color: "#5379ff"
}, {
    label: "annotationColorOrange",
    color: "#ff630c"
}];
const PEN_COLORS = [{
    label: "annotationColorBlack",
    color: "#000000"
}, {
    label: "ink2BrushColorDarkGrey2",
    color: "#5f6368"
}, {
    label: "ink2BrushColorDarkGrey1",
    color: "#9aa0a6"
}, {
    label: "annotationColorLightGrey",
    color: "#dadce0"
}, {
    label: "annotationColorWhite",
    color: "#ffffff"
}, {
    label: "ink2BrushColorRed1",
    color: "#f28b82"
}, {
    label: "ink2BrushColorYellow1",
    color: "#fdd663"
}, {
    label: "ink2BrushColorGreen1",
    color: "#81c995"
}, {
    label: "ink2BrushColorBlue1",
    color: "#8ab4f8"
}, {
    label: "ink2BrushColorTan1",
    color: "#eec9ae"
}, {
    label: "ink2BrushColorRed2",
    color: "#ea4335"
}, {
    label: "ink2BrushColorYellow2",
    color: "#fbbc04"
}, {
    label: "ink2BrushColorGreen2",
    color: "#34a853"
}, {
    label: "ink2BrushColorBlue2",
    color: "#4285f4"
}, {
    label: "ink2BrushColorTan2",
    color: "#e2a185"
}, {
    label: "ink2BrushColorRed3",
    color: "#c5221f"
}, {
    label: "ink2BrushColorYellow3",
    color: "#f29900"
}, {
    label: "ink2BrushColorGreen3",
    color: "#188038"
}, {
    label: "ink2BrushColorBlue3",
    color: "#1967d2"
}, {
    label: "ink2BrushColorTan3",
    color: "#885945"
}];
function areColorsEqual(lhs, rhs) {
    return lhs.r === rhs.r && lhs.g === rhs.g && lhs.b === rhs.b
}
function getNewColorIndex(key, currentIndex, numOptions) {
    let delta;
    switch (key) {
    case "ArrowLeft":
        delta = currentIndex % NUM_OPTION_COLUMNS === 0 ? NUM_OPTION_COLUMNS - 1 : -1;
        break;
    case "ArrowUp":
        delta = currentIndex < NUM_OPTION_COLUMNS ? numOptions - NUM_OPTION_COLUMNS : -NUM_OPTION_COLUMNS;
        break;
    case "ArrowRight":
        delta = currentIndex % NUM_OPTION_COLUMNS === NUM_OPTION_COLUMNS - 1 ? -NUM_OPTION_COLUMNS + 1 : 1;
        break;
    case "ArrowDown":
        delta = currentIndex >= numOptions - NUM_OPTION_COLUMNS ? -numOptions + NUM_OPTION_COLUMNS : NUM_OPTION_COLUMNS;
        break;
    default:
        assertNotReached()
    }
    return currentIndex + delta
}
const InkColorSelectorElementBase = I18nMixinLit(CrLitElement);
class InkColorSelectorElement extends InkColorSelectorElementBase {
    constructor() {
        super(...arguments);
        this.currentColor = {
            r: 0,
            g: 0,
            b: 0
        };
        this.currentType = AnnotationBrushType.PEN
    }
    static get is() {
        return "ink-color-selector"
    }
    static get styles() {
        return getCss$n()
    }
    render() {
        return getHtml$k.bind(this)()
    }
    static get properties() {
        return {
            currentColor: {
                notify: true,
                type: Object
            },
            currentType: {
                type: String
            }
        }
    }
    onColorClick_(e) {
        this.setBrushColor_(e.currentTarget)
    }
    onColorKeydown_(e) {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowUp" && e.key !== "ArrowRight" && e.key !== "ArrowDown") {
            return
        }
        e.preventDefault();
        const colorButton = e.target;
        const currentIndex = Number(colorButton.dataset["index"]);
        const brushColors = this.getCurrentBrushColors_();
        const numOptions = brushColors.length;
        const newIndex = getNewColorIndex(e.key, currentIndex, numOptions);
        assert(newIndex >= 0);
        assert(newIndex < numOptions);
        const newColor = brushColors[newIndex].color;
        const newColorButton = this.shadowRoot.querySelector(`[value='${newColor}']`);
        assert(newColorButton);
        this.setBrushColor_(newColorButton);
        newColorButton.focus()
    }
    isCurrentColor_(hex) {
        return areColorsEqual(this.currentColor, hexToColor(hex))
    }
    getColorName_() {
        assert(this.currentType !== AnnotationBrushType.ERASER);
        return this.currentType === AnnotationBrushType.HIGHLIGHTER ? "highlighterColors" : "penColors"
    }
    getVisibleColor_(hex) {
        if (this.currentType !== AnnotationBrushType.HIGHLIGHTER) {
            return hex
        }
        const color = hexToColor(hex);
        color.r = blendHighlighterColorValue(color.r);
        color.g = blendHighlighterColorValue(color.g);
        color.b = blendHighlighterColorValue(color.b);
        return colorToHex(color)
    }
    getCurrentBrushColors_() {
        assert(this.currentType !== AnnotationBrushType.ERASER);
        return this.currentType === AnnotationBrushType.HIGHLIGHTER ? HIGHLIGHTER_COLORS : PEN_COLORS
    }
    setBrushColor_(colorButton) {
        const hex = colorButton.value;
        assert(hex);
        const newColor = hexToColor(hex);
        if (areColorsEqual(this.currentColor, newColor)) {
            return
        }
        this.currentColor = newColor
    }
}
customElements.define(InkColorSelectorElement.is, InkColorSelectorElement);
const sheet = new CSSStyleSheet;
sheet.replaceSync(`html{--iron-icon-height:20px;--iron-icon-width:20px;--viewer-border-color:rgb(94, 94, 94);--viewer-icon-ink-background-color:rgb(143, 143, 143);--viewer-icon-ink-fill-color:rgb(199, 199, 199);--viewer-icon-ink-selected-fill-color:rgb(168, 199, 250);--viewer-icon-ink-selected-background-color:rgba(76, 141, 246, 0.32);--viewer-pdf-toolbar-background-color:rgb(50, 54, 57);--viewer-side-background-color:var(--viewer-pdf-toolbar-background-color);--viewer-text-input-selection-color:rgba(255, 255, 255, 0.3)}html[pdfcr23enabled]{--viewer-pdf-toolbar-background-color:rgb(60, 60, 60);--viewer-side-background-color:rgb(40, 41, 42)}`);
document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
let instance$o = null;
function getCss$m() {
    return instance$o || (instance$o = [...[], css`:host{display:inline-block}div{display:flex;justify-content:center}cr-icon-button{--cr-icon-button-fill-color:var(--viewer-icon-ink-fill-color);--cr-icon-button-icon-size:24px;--cr-icon-button-size:36px;margin:6px}cr-icon-button[data-selected=true]{--cr-icon-button-fill-color:var(--viewer-icon-ink-selected-fill-color);background-color:var(--viewer-icon-ink-selected-background-color)}`])
}
function getHtml$j() {
    return html`
    <div role="listbox" @keydown="${this.onSizeKeydown_}">
      ${this.getCurrentBrushSizes_().map(( (item, index) => html`
        <cr-icon-button iron-icon="pdf:${item.icon}" role="option"
            tabindex="${this.getTabIndexForSize_(item.size)}"
            data-index="${index}" data-size="${item.size}"
            data-selected="${this.isCurrentSize_(item.size)}"
            aria-selected="${this.isCurrentSize_(item.size)}"
            aria-label="${this.i18n(item.label)}"
            title="${this.i18n(item.label)}"
            @click="${this.onSizeClick_}"></cr-icon-button>
      `))}
    </div>
  `
}
const ERASER_SIZES = [{
    icon: "eraser-size-1",
    label: "ink2BrushSizeExtraThin",
    size: 1
}, {
    icon: "eraser-size-2",
    label: "ink2BrushSizeThin",
    size: 2
}, {
    icon: "eraser-size-3",
    label: "ink2BrushSizeMedium",
    size: 3
}, {
    icon: "eraser-size-4",
    label: "ink2BrushSizeThick",
    size: 6
}, {
    icon: "eraser-size-5",
    label: "ink2BrushSizeExtraThick",
    size: 8
}];
const PEN_SIZES = [{
    icon: "pen-size-1",
    label: "ink2BrushSizeExtraThin",
    size: 1
}, {
    icon: "pen-size-2",
    label: "ink2BrushSizeThin",
    size: 2
}, {
    icon: "pen-size-3",
    label: "ink2BrushSizeMedium",
    size: 3
}, {
    icon: "pen-size-4",
    label: "ink2BrushSizeThick",
    size: 6
}, {
    icon: "pen-size-5",
    label: "ink2BrushSizeExtraThick",
    size: 8
}];
const HIGHLIGHTER_SIZES = [{
    icon: "highlighter-size-1",
    label: "ink2BrushSizeExtraThin",
    size: 4
}, {
    icon: "highlighter-size-2",
    label: "ink2BrushSizeThin",
    size: 6
}, {
    icon: "highlighter-size-3",
    label: "ink2BrushSizeMedium",
    size: 8
}, {
    icon: "highlighter-size-4",
    label: "ink2BrushSizeThick",
    size: 12
}, {
    icon: "highlighter-size-5",
    label: "ink2BrushSizeExtraThick",
    size: 16
}];
const InkSizeSelectorElementBase = I18nMixinLit(CrLitElement);
class InkSizeSelectorElement extends InkSizeSelectorElementBase {
    constructor() {
        super(...arguments);
        this.currentSize = 0;
        this.currentType = AnnotationBrushType.PEN
    }
    static get is() {
        return "ink-size-selector"
    }
    static get styles() {
        return getCss$m()
    }
    render() {
        return getHtml$j.bind(this)()
    }
    static get properties() {
        return {
            currentSize: {
                notify: true,
                type: Number
            },
            currentType: {
                type: String
            }
        }
    }
    isCurrentSize_(size) {
        return this.currentSize === size
    }
    getTabIndexForSize_(size) {
        return this.isCurrentSize_(size) ? 0 : -1
    }
    onSizeClick_(e) {
        this.setBrushSize_(e.currentTarget)
    }
    onSizeKeydown_(e) {
        const isPrevious = e.key === "ArrowLeft" || e.key === "ArrowUp";
        const isNext = e.key === "ArrowRight" || e.key === "ArrowDown";
        if (!isPrevious && !isNext) {
            return
        }
        e.preventDefault();
        const currSizeButton = e.target;
        const currentIndex = Number(currSizeButton.dataset["index"]);
        const brushSizes = this.getCurrentBrushSizes_();
        const numOptions = brushSizes.length;
        const delta = isNext ? 1 : -1;
        const newIndex = (numOptions + currentIndex + delta) % numOptions;
        const newSize = brushSizes[newIndex].size;
        const newSizeButton = this.shadowRoot.querySelector(`[data-size='${newSize}']`);
        assert(newSizeButton);
        this.setBrushSize_(newSizeButton);
        newSizeButton.focus()
    }
    getCurrentBrushSizes_() {
        switch (this.currentType) {
        case AnnotationBrushType.ERASER:
            return ERASER_SIZES;
        case AnnotationBrushType.HIGHLIGHTER:
            return HIGHLIGHTER_SIZES;
        case AnnotationBrushType.PEN:
            return PEN_SIZES
        }
    }
    setBrushSize_(sizeButton) {
        const size = Number(sizeButton.dataset["size"]);
        if (this.currentSize === size) {
            return
        }
        this.currentSize = size
    }
}
customElements.define(InkSizeSelectorElement.is, InkSizeSelectorElement);
let instance$n = null;
function getCss$l() {
    return instance$n || (instance$n = [...[getCss$r()], css`#item{align-items:flex-start;display:flex;padding:5px 28px;position:relative;transition:background-color .1s ease-out}#item:hover{background-color:rgba(255,255,255,.25)}#title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}:host(:not([save-allowed_])) #title{opacity:var(--cr-disabled-opacity)}#download{--cr-icon-button-fill-color:var(--primary-text-color);--cr-icon-button-icon-size:16px;--cr-icon-button-size:28px;margin:0;position:absolute;right:0;top:calc((100% - var(--cr-icon-button-size))/ 2)}#download:focus-visible{outline:auto -webkit-focus-ring-color}`])
}
function getHtml$i() {
    return html`<!--_html_template_start_-->
<div id="item">
  <span id="title">${this.attachment.name}</span>
  <cr-icon-button id="download" tabindex="0" ?hidden="${!this.saveAllowed_}"
      title="Download the attachment" iron-icon="cr:file-download"
      @click="${this.onDownloadClick_}">
  </cr-icon-button>
</div>
<!--_html_template_end_-->`
}
class ViewerAttachmentElement extends CrLitElement {
    constructor() {
        super(...arguments);
        this.attachment = {
            name: "",
            size: 0,
            readable: false
        };
        this.index = -1;
        this.saveAllowed_ = false
    }
    static get is() {
        return "viewer-attachment"
    }
    static get styles() {
        return getCss$l()
    }
    render() {
        return getHtml$i.bind(this)()
    }
    static get properties() {
        return {
            attachment: {
                type: Object
            },
            index: {
                type: Number
            },
            saveAllowed_: {
                type: Boolean,
                reflect: true
            }
        }
    }
    willUpdate(changedProperties) {
        super.willUpdate(changedProperties);
        if (changedProperties.has("attachment")) {
            this.saveAllowed_ = !!this.attachment && this.attachment.size !== -1
        }
    }
    onDownloadClick_() {
        if (!this.attachment || this.attachment.size === -1) {
            return
        }
        this.dispatchEvent(new CustomEvent("save-attachment",{
            detail: this.index,
            bubbles: true,
            composed: true
        }))
    }
}
customElements.define(ViewerAttachmentElement.is, ViewerAttachmentElement);
let instance$m = null;
function getCss$k() {
    return instance$m || (instance$m = [...[getCss$o()], css`:host{display:block;padding-inline-end:20px;padding-top:20px}#warning{align-items:flex-start;padding:5px 28px 15px;position:relative}`])
}
function getHtml$h() {
    return html`<!--_html_template_start_-->
<div id="warning" ?hidden="${!this.exceedSizeLimit_()}">
  Files over 100MB are not available for download
</div>
${this.attachments.map(( (item, index) => html`
  <viewer-attachment .attachment="${item}" .index="${index}">
  </viewer-attachment>`))}
<!--_html_template_end_-->`
}
class ViewerAttachmentBarElement extends CrLitElement {
    constructor() {
        super(...arguments);
        this.attachments = []
    }
    static get is() {
        return "viewer-attachment-bar"
    }
    static get styles() {
        return getCss$k()
    }
    render() {
        return getHtml$h.bind(this)()
    }
    static get properties() {
        return {
            attachments: {
                type: Array
            }
        }
    }
    exceedSizeLimit_() {
        return this.attachments.some((attachment => attachment.size === -1))
    }
}
customElements.define(ViewerAttachmentBarElement.is, ViewerAttachmentBarElement);
let instance$l = null;
function getCss$j() {
    return instance$l || (instance$l = [...[getCss$o()], css`:host{--dropdown-button-size:40px;position:relative}cr-button{--iron-icon-fill-color:var(--viewer-icon-ink-fill-color);border:none;height:var(--dropdown-button-size);width:var(--dropdown-button-size);margin:4px;min-width:auto}cr-button[data-selected=true]{--iron-icon-fill-color:var(--viewer-icon-ink-selected-fill-color);background-color:var(--viewer-icon-ink-selected-background-color)}div{background-color:var(--viewer-side-background-color);bottom:56px;border-radius:8px;left:50%;padding:0 8px;position:absolute;transform:translateX(-50%)}`])
}
function getHtml$g() {
    return html`
    <cr-button @click="${this.toggleDropdown_}"
        data-selected="${this.showDropdown_}"
        title="${this.buttonTitle}">
      <slot name="icon"></slot>
    </cr-button>
    <div>
      ${this.showDropdown_ ? html`<slot name="menu"></slot>` : ""}
    </div>
  `
}
class ViewerBottomToolbarDropdownElement extends CrLitElement {
    constructor() {
        super(...arguments);
        this.buttonTitle = "";
        this.showDropdown_ = false;
        this.pluginController_ = PluginController.getInstance();
        this.tracker_ = new EventTracker
    }
    static get is() {
        return "viewer-bottom-toolbar-dropdown"
    }
    static get styles() {
        return getCss$j()
    }
    render() {
        return getHtml$g.bind(this)()
    }
    static get properties() {
        return {
            buttonTitle: {
                type: String
            },
            showDropdown_: {
                type: Boolean
            }
        }
    }
    connectedCallback() {
        super.connectedCallback();
        this.tracker_.add(this.pluginController_.getEventTarget(), PluginControllerEventType.CONTENT_FOCUSED, this.handleContentFocused_.bind(this))
    }
    disconnectedCallback() {
        this.tracker_.removeAll();
        super.disconnectedCallback()
    }
    toggleDropdown_() {
        this.showDropdown_ = !this.showDropdown_;
        if (this.showDropdown_) {
            this.tracker_.add(this, "focusout", this.handleFocusOut_.bind(this))
        } else {
            this.tracker_.remove(this, "focusout")
        }
    }
    handleFocusOut_(e) {
        if (!(e.relatedTarget instanceof HTMLElement)) {
            return
        }
        const nextElement = e.relatedTarget;
        if (!this.showDropdown_ || nextElement !== this && this.contains(nextElement)) {
            return
        }
        this.toggleDropdown_()
    }
    handleContentFocused_() {
        if (this.showDropdown_) {
            this.toggleDropdown_()
        }
    }
}
customElements.define(ViewerBottomToolbarDropdownElement.is, ViewerBottomToolbarDropdownElement);
let instance$k = null;
function getCss$i() {
    return instance$k || (instance$k = [...[getCss$o()], css`:host{--cr-icon-button-margin-end:0;--cr-icon-button-margin-start:0;align-items:center;background-color:var(--viewer-side-background-color);bottom:0;border-radius:28px 28px 0 0;display:flex;padding:8px;position:absolute}#vertical-separator{background:rgba(255,255,255,.3);height:15px;margin-inline:12px;width:1px}:host-context([pdfcr23enabled]) #vertical-separator{height:20px}ink-brush-selector{--ink-brush-button-gap:4px;--ink-brush-button-size:40px;padding:4px}ink-color-selector{padding:20px}#color-chip{background:var(--ink-brush-color,#ff00ff);border:1px solid var(--viewer-icon-ink-background-color);border-radius:50%;height:20px;width:20px}`])
}
function getHtml$f() {
    return html`
    <ink-brush-selector .currentType="${this.currentType}">
    </ink-brush-selector>
    <span id="vertical-separator"></span>
    <viewer-bottom-toolbar-dropdown id="size"
        .buttonTitle="${this.getSizeTitle_()}">
      <cr-icon slot="icon" icon="${this.getSizeIcon_()}"></cr-icon>
      <ink-size-selector slot="menu" .currentSize="${this.currentSize}"
          .currentType="${this.currentType}"></ink-size-selector>
    </viewer-bottom-toolbar-dropdown>
    ${this.shouldShowColorOptions_() ? html`
      <viewer-bottom-toolbar-dropdown id="color"
          .buttonTitle="${this.getColorTitle_()}">
        <div slot="icon" id="color-chip"></div>
        <ink-color-selector slot="menu" .currentColor="${this.currentColor}"
            .currentType="${this.currentType}"></ink-color-selector>
      </viewer-bottom-toolbar-dropdown>` : ""}
  `
}
class ViewerBottomToolbarElement extends CrLitElement {
    static get is() {
        return "viewer-bottom-toolbar"
    }
    static get styles() {
        return getCss$i()
    }
    render() {
        return getHtml$f.bind(this)()
    }
    static get properties() {
        return {
            currentColor: {
                type: Object
            },
            currentSize: {
                type: Number
            },
            currentType: {
                type: String
            },
            strings: {
                type: Object
            }
        }
    }
    constructor() {
        super();
        this.currentSize = 0;
        this.currentType = AnnotationBrushType.PEN;
        record(UserAction.OPEN_INK2_BOTTOM_TOOLBAR)
    }
    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has("currentColor") && this.currentColor) {
            this.onCurrentColorUpdated_()
        }
    }
    getSizeIcon_() {
        let options;
        switch (this.currentType) {
        case AnnotationBrushType.ERASER:
            options = ERASER_SIZES;
            break;
        case AnnotationBrushType.HIGHLIGHTER:
            options = HIGHLIGHTER_SIZES;
            break;
        case AnnotationBrushType.PEN:
            options = PEN_SIZES;
            break;
        default:
            assertNotReached()
        }
        assert(options);
        const option = options.find((option => option.size === this.currentSize));
        assert(option);
        return "pdf:" + option.icon
    }
    getSizeTitle_() {
        return this.strings ? loadTimeData.getString("ink2Size") : ""
    }
    getColorTitle_() {
        return this.strings ? loadTimeData.getString("ink2Color") : ""
    }
    onCurrentColorUpdated_() {
        assert(this.currentColor);
        const color = this.currentType === AnnotationBrushType.HIGHLIGHTER ? {
            r: blendHighlighterColorValue(this.currentColor.r),
            g: blendHighlighterColorValue(this.currentColor.g),
            b: blendHighlighterColorValue(this.currentColor.b)
        } : this.currentColor;
        this.style.setProperty("--ink-brush-color", colorToHex(color))
    }
    shouldShowColorOptions_() {
        return this.currentType !== AnnotationBrushType.ERASER
    }
}
customElements.define(ViewerBottomToolbarElement.is, ViewerBottomToolbarElement);
let instance$j = null;
function getCss$h() {
    return instance$j || (instance$j = [...[getCss$o(), getCss$r()], css`#item{align-items:flex-start;cursor:pointer;display:flex;padding:5px 0;position:relative;transition:background-color .1s ease-out}#item:hover{background-color:var(--cr-menu-background-focus-color)}#item:active{background-color:rgba(255,255,255,.25)}#title{outline:0;overflow:hidden;text-overflow:ellipsis}#title:focus-visible{outline:auto -webkit-focus-ring-color}#expand-container{--expand-button-size:28px;flex-shrink:0;position:relative;width:var(--expand-button-size)}#expand-container::before{content:'.';visibility:hidden}#expand{--cr-icon-button-fill-color:var(--primary-text-color);--cr-icon-button-icon-size:16px;--cr-icon-button-size:var(--expand-button-size);left:0;margin:0;position:absolute;top:calc((100% - var(--cr-icon-button-size))/ 2);transition:transform 150ms}:host-context([dir=rtl]) #expand{transform:rotate(180deg)}:host([children-shown_]) #expand{transform:rotate(90deg)}`])
}
function getHtml$e() {
    return html`<!--_html_template_start_-->
<div id="item" @click="${this.onClick_}"
    .style="${this.getItemStartPaddingStyle_()}">
  <div id="expand-container">
    <cr-icon-button id="expand" iron-icon="cr:chevron-right"
        ?hidden="${this.getExpandHidden_()}"
        aria-label="Section"
        aria-expanded="${this.childrenShown_}"
        @click="${this.toggleChildren_}"></cr-icon-button>
  </div>
  <span id="title" tabindex="0">${this.bookmark.title}</span>
</div>
${this.childrenShown_ ? html`
  ${this.bookmark.children.map((item => html`
    <viewer-bookmark .bookmark="${item}" .depth="${this.getChildDepth_()}">
    </viewer-bookmark>`))}` : ""}
<!--_html_template_end_-->`
}
const BOOKMARK_INDENT = 20;
var ChangePageOrigin;
(function(ChangePageOrigin) {
    ChangePageOrigin["BOOKMARK"] = "bookmark";
    ChangePageOrigin["THUMBNAIL"] = "thumbnail";
    ChangePageOrigin["PAGE_SELECTOR"] = "pageSelector"
}
)(ChangePageOrigin || (ChangePageOrigin = {}));
class ViewerBookmarkElement extends CrLitElement {
    constructor() {
        super(...arguments);
        this.bookmark = {
            title: "",
            children: []
        };
        this.depth = 0;
        this.childrenShown_ = false
    }
    static get is() {
        return "viewer-bookmark"
    }
    static get styles() {
        return getCss$h()
    }
    render() {
        return getHtml$e.bind(this)()
    }
    static get properties() {
        return {
            bookmark: {
                type: Object
            },
            depth: {
                type: Number
            },
            childrenShown_: {
                type: Boolean,
                reflect: true
            }
        }
    }
    firstUpdated() {
        this.$.item.addEventListener("keydown", (e => {
            if (e.key === "Enter") {
                this.onEnter_(e)
            } else if (e.key === " ") {
                this.onSpace_(e)
            }
        }
        ))
    }
    getItemStartPaddingStyle_() {
        return `padding-inline-start: ${this.depth * BOOKMARK_INDENT}px`
    }
    getChildDepth_() {
        return this.depth + 1
    }
    getExpandHidden_() {
        return this.bookmark.children.length <= 0
    }
    onClick_() {
        if (this.bookmark.page != null) {
            if (this.bookmark.zoom != null) {
                this.fire("change-zoom", {
                    zoom: this.bookmark.zoom
                })
            }
            if (this.bookmark.x != null && this.bookmark.y != null) {
                this.fire("change-page-and-xy", {
                    page: this.bookmark.page,
                    x: this.bookmark.x,
                    y: this.bookmark.y,
                    origin: ChangePageOrigin.BOOKMARK
                })
            } else {
                this.fire("change-page", {
                    page: this.bookmark.page,
                    origin: ChangePageOrigin.BOOKMARK
                })
            }
        } else if (this.bookmark.uri != null) {
            this.fire("navigate", {
                uri: this.bookmark.uri,
                newtab: true
            })
        }
    }
    onEnter_(e) {
        if (e.target !== this.$.expand) {
            this.onClick_()
        }
    }
    onSpace_(e) {
        this.onClick_();
        e.preventDefault()
    }
    toggleChildren_(e) {
        this.childrenShown_ = !this.childrenShown_;
        e.stopPropagation()
    }
}
customElements.define(ViewerBookmarkElement.is, ViewerBookmarkElement);
let instance$i = null;
function getCss$g() {
    return instance$i || (instance$i = [...[getCss$o()], css`:host{display:block;padding-inline-end:20px;padding-top:20px}`])
}
function getHtml$d() {
    return this.bookmarks.map((item => html`<viewer-bookmark .bookmark="${item}" depth="0"></viewer-bookmark>`))
}
class ViewerDocumentOutlineElement extends CrLitElement {
    constructor() {
        super(...arguments);
        this.bookmarks = []
    }
    static get is() {
        return "viewer-document-outline"
    }
    static get styles() {
        return getCss$g()
    }
    render() {
        return getHtml$d.bind(this)()
    }
    static get properties() {
        return {
            bookmarks: {
                type: Array
            }
        }
    }
}
customElements.define(ViewerDocumentOutlineElement.is, ViewerDocumentOutlineElement);
let instance$h = null;
function getCss$f() {
    return instance$h || (instance$h = [...[getCss$o()], css`:host{display:contents}cr-action-menu::part(dialog){position:fixed;top:48px}:host([menu-open_]) #download{background-color:var(--active-button-bg);border-radius:50%}`])
}
function getHtml$c() {
    return html`<!--_html_template_start_-->
<cr-icon-button id="download" iron-icon="cr:file-download"
    @click="${this.onDownloadClick_}" aria-label="Download"
    aria-haspopup="${this.downloadHasPopup_()}"
    title="Download"></cr-icon-button>
<cr-action-menu id="menu" @open-changed="${this.onOpenChanged_}">
  <button id="download-edited" class="dropdown-item"
      @click="${this.onDownloadEditedClick_}">
    With your changes
  </button>
  <button id="download-original" class="dropdown-item"
      @click="${this.onDownloadOriginalClick_}">
    Without your changes
  </button>
</cr-action-menu>
<!--_html_template_end_-->`
}
class ViewerDownloadControlsElement extends CrLitElement {
    constructor() {
        super(...arguments);
        this.hasEdits = false;
        this.hasEnteredAnnotationMode = false;
        this.hasInk2Edits = false;
        this.isFormFieldFocused = false;
        this.menuOpen_ = false;
        this.waitForFormFocusChange_ = null
    }
    static get is() {
        return "viewer-download-controls"
    }
    static get styles() {
        return getCss$f()
    }
    render() {
        return getHtml$c.bind(this)()
    }
    static get properties() {
        return {
            hasEdits: {
                type: Boolean
            },
            hasEnteredAnnotationMode: {
                type: Boolean
            },
            hasInk2Edits: {
                type: Boolean
            },
            isFormFieldFocused: {
                type: Boolean
            },
            menuOpen_: {
                type: Boolean,
                reflect: true
            }
        }
    }
    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has("isFormFieldFocused") && this.waitForFormFocusChange_ !== null) {
            this.waitForFormFocusChange_.resolve(this.hasEdits);
            this.waitForFormFocusChange_ = null
        }
    }
    isMenuOpen() {
        return this.menuOpen_
    }
    closeMenu() {
        this.$.menu.close()
    }
    onOpenChanged_(e) {
        this.menuOpen_ = e.detail.value
    }
    hasEditsToSave_() {
        return this.hasEnteredAnnotationMode || this.hasEdits || this.hasInk2Edits
    }
    downloadHasPopup_() {
        return this.hasEditsToSave_() ? "menu" : "false"
    }
    showDownloadMenu_() {
        this.$.menu.showAt(this.$.download, {
            anchorAlignmentX: AnchorAlignment.CENTER
        });
        this.dispatchEvent(new CustomEvent("download-menu-shown-for-testing",{
            bubbles: true,
            composed: true
        }))
    }
    onDownloadClick_() {
        this.waitForEdits_().then((hasEdits => {
            if (hasEdits) {
                this.showDownloadMenu_()
            } else {
                this.dispatchSaveEvent_(SaveRequestType.ORIGINAL)
            }
        }
        ))
    }
    waitForEdits_() {
        if (this.hasEditsToSave_()) {
            return Promise.resolve(true)
        }
        if (!this.isFormFieldFocused) {
            return Promise.resolve(false)
        }
        this.waitForFormFocusChange_ = new PromiseResolver;
        return this.waitForFormFocusChange_.promise
    }
    dispatchSaveEvent_(type) {
        this.dispatchEvent(new CustomEvent("save",{
            detail: type,
            bubbles: true,
            composed: true
        }))
    }
    onDownloadOriginalClick_() {
        this.dispatchSaveEvent_(SaveRequestType.ORIGINAL);
        this.$.menu.close()
    }
    onDownloadEditedClick_() {
        this.$.menu.close();
        if (this.hasInk2Edits) {
            this.dispatchSaveEvent_(SaveRequestType.ANNOTATION);
            return
        }
        this.dispatchSaveEvent_(this.hasEnteredAnnotationMode ? SaveRequestType.ANNOTATION : SaveRequestType.EDITED)
    }
}
customElements.define(ViewerDownloadControlsElement.is, ViewerDownloadControlsElement);
let instance$g = null;
function getCss$e() {
    return instance$g || (instance$g = [...[], css`#content{align-items:center;color:#fff;direction:ltr;display:flex;font-size:.81rem;text-align:center;--page-selector-spacing:4px}#pageSelector::selection{background-color:var(--viewer-text-input-selection-color)}#pagelength,input{width:calc(max(2,var(--page-length-digits)) * 1ch + 1px)}input{background:rgba(0,0,0,.5);border:none;color:#fff;font-family:inherit;line-height:inherit;outline:0;padding:0 var(--page-selector-spacing);text-align:center}#divider{margin:0 var(--page-selector-spacing)}`])
}
function getHtml$b() {
    return html`<!--_html_template_start_-->
<div id="content">
  <input part="input" type="text" id="pageSelector" .value="${this.pageNo}"
      @pointerup="${this.select}" @input="${this.onInput_}"
      @change="${this.pageNoCommitted}" aria-label="Page number">
  <span id="divider">/</span>
  <span id="pagelength">${this.docLength}</span>
</div>
<!--_html_template_end_-->`
}
class ViewerPageSelectorElement extends CrLitElement {
    constructor() {
        super(...arguments);
        this.docLength = 1;
        this.pageNo = 1
    }
    static get is() {
        return "viewer-page-selector"
    }
    static get styles() {
        return getCss$e()
    }
    render() {
        return getHtml$b.bind(this)()
    }
    static get properties() {
        return {
            docLength: {
                type: Number
            },
            pageNo: {
                type: Number
            }
        }
    }
    willUpdate(changedProperties) {
        super.willUpdate(changedProperties);
        if (changedProperties.has("docLength")) {
            const numDigits = this.docLength.toString().length;
            this.style.setProperty("--page-length-digits", `${numDigits}`)
        }
    }
    pageNoCommitted() {
        const page = parseInt(this.$.pageSelector.value, 10);
        if (!isNaN(page) && page <= this.docLength && page > 0) {
            this.dispatchEvent(new CustomEvent("change-page",{
                detail: {
                    page: page - 1,
                    origin: ChangePageOrigin.PAGE_SELECTOR
                },
                composed: true
            }))
        } else {
            this.$.pageSelector.value = this.pageNo.toString()
        }
        this.$.pageSelector.blur()
    }
    select() {
        this.$.pageSelector.select()
    }
    isActive() {
        return this.shadowRoot.activeElement === this.$.pageSelector
    }
    onInput_() {
        this.$.pageSelector.value = this.$.pageSelector.value.replace(/[^\d]/, "")
    }
}
customElements.define(ViewerPageSelectorElement.is, ViewerPageSelectorElement);
let instance$f = null;
function getCss$d() {
    return instance$f || (instance$f = [...[getCss$r(), getCss$s()], css`[actionable]{cursor:pointer}.hr{border-top:var(--cr-separator-line)}iron-list.cr-separators>:not([first]){border-top:var(--cr-separator-line)}[scrollable]{border-color:transparent;border-style:solid;border-width:1px 0;overflow-y:auto}[scrollable].is-scrolled{border-top-color:var(--scrollable-border-color)}[scrollable].can-scroll:not(.scrolled-to-bottom){border-bottom-color:var(--scrollable-border-color)}[scrollable] iron-list>:not(.no-outline):focus,[selectable]:focus,[selectable]>:focus{background-color:var(--cr-focused-item-color);outline:0}.scroll-container{display:flex;flex-direction:column;min-height:1px}[selectable]>*{cursor:pointer}.cr-centered-card-container{box-sizing:border-box;display:block;height:inherit;margin:0 auto;max-width:var(--cr-centered-card-max-width);min-width:550px;position:relative;width:calc(100% * var(--cr-centered-card-width-percentage))}.cr-container-shadow{box-shadow:inset 0 5px 6px -3px rgba(0,0,0,.4);height:var(--cr-container-shadow-height);left:0;margin:0 0 var(--cr-container-shadow-margin);opacity:0;pointer-events:none;position:relative;right:0;top:0;transition:opacity .5s;z-index:1}#cr-container-shadow-bottom{margin-bottom:0;margin-top:var(--cr-container-shadow-margin);transform:scaleY(-1)}#container.can-scroll:not(.scrolled-to-bottom)+#cr-container-shadow-bottom,#cr-container-shadow-bottom.force-shadow,#cr-container-shadow-top.force-shadow,#cr-container-shadow-top:has(+#container.can-scroll:not(.scrolled-to-top)){opacity:var(--cr-container-shadow-max-opacity)}.cr-row{align-items:center;border-top:var(--cr-separator-line);display:flex;min-height:var(--cr-section-min-height);padding:0 var(--cr-section-padding)}.cr-row.continuation,.cr-row.first{border-top:none}.cr-row-gap{padding-inline-start:16px}.cr-button-gap{margin-inline-start:8px}cr-tooltip::part(tooltip),paper-tooltip::part(tooltip){border-radius:var(--paper-tooltip-border-radius,2px);font-size:92.31%;font-weight:500;max-width:330px;min-width:var(--paper-tooltip-min-width,200px);padding:var(--paper-tooltip-padding,10px 8px)}.cr-padded-text{padding-block-end:var(--cr-section-vertical-padding);padding-block-start:var(--cr-section-vertical-padding)}.cr-title-text{color:var(--cr-title-text-color);font-size:107.6923%;font-weight:500}.cr-secondary-text{color:var(--cr-secondary-text-color);font-weight:400}.cr-form-field-label{color:var(--cr-form-field-label-color);display:block;font-size:var(--cr-form-field-label-font-size);font-weight:500;letter-spacing:.4px;line-height:var(--cr-form-field-label-line-height);margin-bottom:8px}.cr-vertical-tab{align-items:center;display:flex}.cr-vertical-tab::before{border-radius:0 3px 3px 0;content:'';display:block;flex-shrink:0;height:var(--cr-vertical-tab-height,100%);width:4px}.cr-vertical-tab.selected::before{background:var(--cr-vertical-tab-selected-color,var(--cr-checked-color))}:host-context([dir=rtl]) .cr-vertical-tab::before{transform:scaleX(-1)}.iph-anchor-highlight{background-color:var(--cr-iph-anchor-highlight-color)}`])
}
let instance$e = null;
function getCss$c() {
    return instance$e || (instance$e = [...[], css`:host{--cr-input-background-color:var(--color-textfield-filled-background,
      var(--cr-fallback-color-surface-variant));--cr-input-border-bottom:1px solid var(--color-textfield-filled-underline,
          var(--cr-fallback-color-outline));--cr-input-border-radius:8px 8px 0 0;--cr-input-color:var(--cr-primary-text-color);--cr-input-error-color:var(--color-textfield-filled-error,
      var(--cr-fallback-color-error));--cr-input-focus-color:var(--color-textfield-filled-underline-focused,
      var(--cr-fallback-color-primary));--cr-input-hover-background-color:var(--cr-hover-background-color);--cr-input-label-color:var(--color-textfield-foreground-label,
      var(--cr-fallback-color-on-surface-subtle));--cr-input-padding-bottom:10px;--cr-input-padding-end:10px;--cr-input-padding-start:10px;--cr-input-padding-top:10px;--cr-input-placeholder-color:var(--color-textfield-foreground-placeholder,
          var(--cr-fallback-on-surface-subtle));display:block;isolation:isolate;outline:0}:host([readonly]){--cr-input-border-radius:8px 8px}#label{color:var(--cr-input-label-color);font-size:11px;line-height:16px}:host([focused_]:not([readonly]):not([invalid])) #label{color:var(--cr-input-focus-label-color,var(--cr-input-label-color))}#input-container{border-radius:var(--cr-input-border-radius,4px);overflow:hidden;position:relative;width:var(--cr-input-width,100%)}:host([focused_]) #input-container{outline:var(--cr-input-focus-outline,none)}#inner-input-container{background-color:var(--cr-input-background-color);box-sizing:border-box;padding:0}#inner-input-content ::slotted(*){--cr-icon-button-fill-color:var(--color-textfield-foreground-icon,
      var(--cr-fallback-color-on-surface-subtle));--cr-icon-button-icon-size:16px;--cr-icon-button-size:24px;--cr-icon-button-margin-start:0;--cr-icon-color:var(--color-textfield-foreground-icon,
      var(--cr-fallback-color-on-surface-subtle))}#inner-input-content ::slotted([slot=inline-prefix]){--cr-icon-button-margin-start:-8px}#inner-input-content ::slotted([slot=inline-suffix]){--cr-icon-button-margin-end:-4px}:host([invalid]) #inner-input-content ::slotted(*){--cr-icon-color:var(--cr-input-error-color);--cr-icon-button-fill-color:var(--cr-input-error-color)}#hover-layer{background-color:var(--cr-input-hover-background-color);display:none;inset:0;pointer-events:none;position:absolute;z-index:0}:host(:not([readonly]):not([disabled])) #input-container:hover #hover-layer{display:block}#input{-webkit-appearance:none;background-color:transparent;border:none;box-sizing:border-box;caret-color:var(--cr-input-focus-color);color:var(--cr-input-color);font-family:inherit;font-size:var(--cr-input-font-size,12px);font-weight:inherit;line-height:16px;min-height:var(--cr-input-min-height,auto);outline:0;padding:0;text-align:inherit;text-overflow:ellipsis;width:100%}#inner-input-content{padding-bottom:var(--cr-input-padding-bottom);padding-inline-end:var(--cr-input-padding-end);padding-inline-start:var(--cr-input-padding-start);padding-top:var(--cr-input-padding-top)}#underline{border-bottom:2px solid var(--cr-input-focus-color);border-radius:var(--cr-input-underline-border-radius,0);bottom:0;box-sizing:border-box;display:var(--cr-input-underline-display);height:var(--cr-input-underline-height,0);left:0;margin:auto;opacity:0;position:absolute;right:0;transition:opacity 120ms ease-out,width 0s linear 180ms;width:0}:host([focused_]) #underline,:host([force-underline]) #underline,:host([invalid]) #underline{opacity:1;transition:opacity 120ms ease-in,width 180ms ease-out;width:100%}#underline-base{display:none}:host([readonly]) #underline{display:none}:host(:not([readonly])) #underline-base{border-bottom:var(--cr-input-border-bottom);bottom:0;display:block;left:0;position:absolute;right:0}:host([disabled]){color:var(--color-textfield-foreground-disabled,var(--cr-fallback-color-disabled-foreground));--cr-input-border-bottom:1px solid currentColor;--cr-input-placeholder-color:currentColor;--cr-input-color:currentColor;--cr-input-background-color:var(--color-textfield-background-disabled,
      var(--cr-fallback-color-disabled-background))}:host([disabled]) #inner-input-content ::slotted(*){--cr-icon-color:currentColor;--cr-icon-button-fill-color:currentColor}:host(.stroked){--cr-input-background-color:transparent;--cr-input-border:1px solid var(--color-side-panel-textfield-border,
      var(--cr-fallback-color-neutral-outline));--cr-input-border-bottom:none;--cr-input-border-radius:8px;--cr-input-padding-bottom:9px;--cr-input-padding-end:9px;--cr-input-padding-start:9px;--cr-input-padding-top:9px;--cr-input-underline-display:none;--cr-input-min-height:36px;line-height:16px}:host(.stroked[focused_]){--cr-input-border:2px solid var(--cr-focus-outline-color);--cr-input-padding-bottom:8px;--cr-input-padding-end:8px;--cr-input-padding-start:8px;--cr-input-padding-top:8px}:host(.stroked[invalid]){--cr-input-border:1px solid var(--cr-input-error-color)}:host(.stroked[focused_][invalid]){--cr-input-border:2px solid var(--cr-input-error-color)}`])
}
let instance$d = null;
function getCss$b() {
    return instance$d || (instance$d = [...[getCss$r(), getCss$c(), getCss$d()], css`:host([disabled]) :-webkit-any(#label,#error,#input-container){opacity:var(--cr-disabled-opacity);pointer-events:none}:host([disabled]) :is(#label,#error,#input-container){opacity:1}:host ::slotted(cr-button[slot=suffix]){margin-inline-start:var(--cr-button-edge-spacing)!important}:host([invalid]) #label{color:var(--cr-input-error-color)}#input{border-bottom:none;letter-spacing:var(--cr-input-letter-spacing)}#input-container{border:var(--cr-input-border,none)}#input::placeholder{color:var(--cr-input-placeholder-color,var(--cr-secondary-text-color));letter-spacing:var(--cr-input-placeholder-letter-spacing)}:host([invalid]) #input{caret-color:var(--cr-input-error-color)}:host([readonly]) #input{opacity:var(--cr-input-readonly-opacity,.6)}:host([invalid]) #underline{border-color:var(--cr-input-error-color)}#error{color:var(--cr-input-error-color);display:var(--cr-input-error-display,block);font-size:11px;min-height:var(--cr-form-field-label-height);line-height:16px;margin:4px 10px;visibility:hidden;white-space:var(--cr-input-error-white-space);height:auto;overflow:hidden;text-overflow:ellipsis}:host([invalid]) #error{visibility:visible}#inner-input-content,#row-container{align-items:center;display:flex;justify-content:space-between;position:relative}#inner-input-content{gap:4px;height:16px;z-index:1}#input[type=search]::-webkit-search-cancel-button{display:none}:host-context([dir=rtl]) #input[type=url]{text-align:right}#input[type=url]{direction:ltr}`])
}
function getHtml$a() {
    return html`
<div id="label" class="cr-form-field-label" ?hidden="${!this.label}"
    aria-hidden="true">
  ${this.label}
</div>
<div id="row-container" part="row-container">
  <div id="input-container">
    <div id="inner-input-container">
      <div id="hover-layer"></div>
      <div id="inner-input-content">
        <slot name="inline-prefix"></slot>
        <input id="input" ?disabled="${this.disabled}"
            ?autofocus="${this.autofocus}"
            .value="${this.internalValue_}" tabindex="${this.inputTabindex}"
            .type="${this.type}"
            ?readonly="${this.readonly}" maxlength="${this.maxlength}"
            pattern="${this.pattern || nothing}" ?required="${this.required}"
            minlength="${this.minlength}" inputmode="${this.inputmode}"
            aria-description="${this.ariaDescription || nothing}"
            aria-errormessage="${this.getAriaErrorMessage_() || nothing}"
            aria-label="${this.getAriaLabel_()}"
            aria-invalid="${this.getAriaInvalid_()}"
            .max="${this.max || nothing}" .min="${this.min || nothing}"
            @focus="${this.onInputFocus_}"
            @blur="${this.onInputBlur_}" @change="${this.onInputChange_}"
            @input="${this.onInput_}"
            part="input"
            autocomplete="off">
        <slot name="inline-suffix"></slot>
      </div>
    </div>
    <div id="underline-base"></div>
    <div id="underline"></div>
  </div>
  <slot name="suffix"></slot>
</div>
<div id="error" role="${this.getErrorRole_() || nothing}"
    aria-live="assertive">${this.getErrorMessage_()}</div>`
}
const SUPPORTED_INPUT_TYPES = new Set(["number", "password", "search", "text", "url"]);
class CrInputElement extends CrLitElement {
    constructor() {
        super(...arguments);
        this.ariaDescription = null;
        this.ariaLabel = "";
        this.autofocus = false;
        this.autoValidate = false;
        this.disabled = false;
        this.errorMessage = "";
        this.inputTabindex = 0;
        this.invalid = false;
        this.label = "";
        this.placeholder = null;
        this.readonly = false;
        this.required = false;
        this.type = "text";
        this.value = "";
        this.internalValue_ = "";
        this.focused_ = false
    }
    static get is() {
        return "cr-input"
    }
    static get styles() {
        return getCss$b()
    }
    render() {
        return getHtml$a.bind(this)()
    }
    static get properties() {
        return {
            ariaDescription: {
                type: String
            },
            ariaLabel: {
                type: String
            },
            autofocus: {
                type: Boolean,
                reflect: true
            },
            autoValidate: {
                type: Boolean
            },
            disabled: {
                type: Boolean,
                reflect: true
            },
            errorMessage: {
                type: String
            },
            errorRole_: {
                type: String
            },
            displayErrorMessage_: {
                type: String
            },
            focused_: {
                type: Boolean,
                reflect: true
            },
            invalid: {
                type: Boolean,
                notify: true,
                reflect: true
            },
            max: {
                type: Number,
                reflect: true
            },
            min: {
                type: Number,
                reflect: true
            },
            maxlength: {
                type: Number,
                reflect: true
            },
            minlength: {
                type: Number,
                reflect: true
            },
            pattern: {
                type: String,
                reflect: true
            },
            inputmode: {
                type: String
            },
            label: {
                type: String
            },
            placeholder: {
                type: String
            },
            readonly: {
                type: Boolean,
                reflect: true
            },
            required: {
                type: Boolean,
                reflect: true
            },
            inputTabindex: {
                type: Number
            },
            type: {
                type: String
            },
            value: {
                type: String,
                notify: true
            },
            internalValue_: {
                type: String,
                state: true
            }
        }
    }
    firstUpdated() {
        assert(!this.hasAttribute("tabindex"))
    }
    willUpdate(changedProperties) {
        super.willUpdate(changedProperties);
        if (changedProperties.has("value")) {
            this.internalValue_ = this.value === undefined || this.value === null ? "" : this.value
        }
        if (changedProperties.has("inputTabindex")) {
            assert(this.inputTabindex === 0 || this.inputTabindex === -1)
        }
        if (changedProperties.has("type")) {
            assert(SUPPORTED_INPUT_TYPES.has(this.type))
        }
    }
    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has("value")) {
            const previous = changedProperties.get("value");
            if ((!!this.value || !!previous) && this.autoValidate) {
                this.invalid = !this.inputElement.checkValidity()
            }
        }
        if (changedProperties.has("placeholder")) {
            if (this.placeholder === null || this.placeholder === undefined) {
                this.inputElement.removeAttribute("placeholder")
            } else {
                this.inputElement.setAttribute("placeholder", this.placeholder)
            }
        }
    }
    get inputElement() {
        return this.$.input
    }
    focus() {
        this.focusInput()
    }
    focusInput() {
        if (this.shadowRoot.activeElement === this.inputElement) {
            return false
        }
        this.inputElement.focus();
        return true
    }
    async onInputChange_(e) {
        await this.updateComplete;
        this.fire("change", {
            sourceEvent: e
        })
    }
    onInput_(e) {
        this.internalValue_ = e.target.value;
        this.value = this.internalValue_
    }
    onInputFocus_() {
        this.focused_ = true
    }
    onInputBlur_() {
        this.focused_ = false
    }
    getAriaLabel_() {
        return this.ariaLabel || this.label || this.placeholder
    }
    getAriaInvalid_() {
        return this.invalid ? "true" : "false"
    }
    getErrorMessage_() {
        return this.invalid ? this.errorMessage : ""
    }
    getErrorRole_() {
        return this.invalid ? "alert" : ""
    }
    getAriaErrorMessage_() {
        return this.invalid ? "error" : ""
    }
    select(start, end) {
        this.inputElement.focus();
        if (start !== undefined && end !== undefined) {
            this.inputElement.setSelectionRange(start, end)
        } else {
            assert(start === undefined && end === undefined);
            this.inputElement.select()
        }
    }
    validate() {
        this.performUpdate();
        this.invalid = !this.inputElement.checkValidity();
        this.performUpdate();
        return !this.invalid
    }
}
customElements.define(CrInputElement.is, CrInputElement);
let instance$c = null;
function getCss$a() {
    return instance$c || (instance$c = [...[getCss$d()], css`#password{margin-top:var(--cr-form-field-bottom-spacing)}`])
}
function getHtml$9() {
    return html`<!--_html_template_start_-->
<cr-dialog id="dialog" no-cancel show-on-attach>
  <div slot="title">Password required</div>
  <div slot="body">
    <div id="message">This document is password protected.  Please enter a password.</div>
    <cr-input id="password" type="password"
        error-message="Incorrect password" .invalid="${this.invalid}"
        autofocus>
    </cr-input>
  </div>
  <div slot="button-container">
    <cr-button id="submit" class="action-button" @click="${this.submit}">
      Submit
    </cr-button>
  </div>
</cr-dialog>
<!--_html_template_end_-->`
}
class ViewerPasswordDialogElement extends CrLitElement {
    constructor() {
        super(...arguments);
        this.invalid = false
    }
    static get is() {
        return "viewer-password-dialog"
    }
    static get styles() {
        return getCss$a()
    }
    render() {
        return getHtml$9.bind(this)()
    }
    static get properties() {
        return {
            invalid: {
                type: Boolean
            }
        }
    }
    close() {
        this.$.dialog.close()
    }
    deny() {
        const password = this.$.password;
        password.disabled = false;
        this.$.submit.disabled = false;
        this.invalid = true;
        password.select();
        this.dispatchEvent(new CustomEvent("password-denied-for-testing"))
    }
    submit() {
        const password = this.$.password;
        if (password.value.length === 0) {
            return
        }
        password.disabled = true;
        this.$.submit.disabled = true;
        this.dispatchEvent(new CustomEvent("password-submitted",{
            detail: {
                password: password.value
            }
        }))
    }
}
customElements.define(ViewerPasswordDialogElement.is, ViewerPasswordDialogElement);
let instance$b = null;
function getCss$9() {
    return instance$b || (instance$b = [...[getCss$o()], css`:host{--focus-border-color:var(--google-blue-300);display:block}:host(:focus){outline:0}#thumbnail{align-items:center;background-color:#fff;cursor:pointer;display:inline-flex;height:140px;justify-content:center;margin-bottom:12px;margin-inline-end:auto;margin-inline-start:auto;width:108px}:host([is-active]) #thumbnail{box-shadow:0 0 0 6px var(--focus-border-color)}:host(:focus-visible) #thumbnail{box-shadow:0 0 0 2px var(--focus-border-color)}:host([is-active]:focus-visible) #thumbnail{box-shadow:0 0 0 8px var(--focus-border-color)}#canvas-container{opacity:.5;position:relative}:host([is-active]) #canvas-container{opacity:1}#canvas-container:hover,:host([is-active]) #canvas-container:hover{opacity:.7}#ink2-canvas{position:absolute;z-index:1}#pdf-canvas{z-index:0}canvas{display:block}#pageNumber{line-height:1}`])
}
function getHtml$8() {
    return html`
<div id="thumbnail" @click="${this.onClick_}" role="button">
  <div id="canvas-container"></div>
</div>
<div id="pageNumber">${this.pageNumber}</div>`
}
const PORTRAIT_WIDTH = 108;
const LANDSCAPE_WIDTH = 140;
const PDF_CANVAS_ID = "pdf-canvas";
const INK2_CANVAS_ID = "ink2-canvas";
const PAINTED_ATTRIBUTE = "painted";
class ViewerThumbnailElement extends CrLitElement {
    constructor() {
        super(...arguments);
        this.clockwiseRotations = 0;
        this.isActive = true;
        this.pageNumber = 0
    }
    static get is() {
        return "viewer-thumbnail"
    }
    static get styles() {
        return getCss$9()
    }
    render() {
        return getHtml$8.bind(this)()
    }
    static get properties() {
        return {
            clockwiseRotations: {
                type: Number
            },
            isActive: {
                type: Boolean,
                reflect: true
            },
            pageNumber: {
                type: Number
            }
        }
    }
    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has("clockwiseRotations")) {
            const canvas = this.getCanvas_();
            if (canvas) {
                this.styleCanvas_(canvas)
            }
            const ink2Canvas = this.getInk2Canvas_();
            if (ink2Canvas) {
                this.styleCanvas_(ink2Canvas)
            }
        }
        if (changedProperties.has("isActive") && this.isActive) {
            this.scrollIntoView({
                block: "nearest"
            })
        }
    }
    createCanvasHelper_(id) {
        const canvas = document.createElement("canvas");
        canvas.id = id;
        canvas.oncontextmenu = e => e.preventDefault();
        return canvas
    }
    setImageHelper_(canvas, imageData) {
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        this.styleCanvas_(canvas);
        const ctx = canvas.getContext("2d");
        ctx.putImageData(imageData, 0, 0)
    }
    set image(imageData) {
        let canvas = this.getCanvas_();
        if (!canvas) {
            canvas = this.createCanvasHelper_(PDF_CANVAS_ID);
            const canvasContainer = this.$.thumbnail.querySelector("#canvas-container");
            canvasContainer.appendChild(canvas)
        }
        this.setImageHelper_(canvas, imageData)
    }
    set ink2Image(imageData) {
        let canvas = this.getInk2Canvas_();
        if (!canvas) {
            canvas = this.createCanvasHelper_(INK2_CANVAS_ID);
            const canvasContainer = this.$.thumbnail.querySelector("#canvas-container");
            canvasContainer.insertBefore(canvas, canvasContainer.firstChild)
        }
        this.setImageHelper_(canvas, imageData)
    }
    clearImage() {
        if (!this.isPainted()) {
            return
        }
        const canvas = this.getCanvas_();
        if (canvas) {
            canvas.remove()
        }
        const ink2Canvas = this.getInk2Canvas_();
        if (ink2Canvas) {
            ink2Canvas.remove()
        }
        this.removeAttribute(PAINTED_ATTRIBUTE)
    }
    getClickTarget() {
        return this.$.thumbnail
    }
    getCanvas_() {
        return this.shadowRoot.querySelector("#" + PDF_CANVAS_ID)
    }
    getInk2Canvas_() {
        return this.shadowRoot.querySelector("#" + INK2_CANVAS_ID)
    }
    getThumbnailCssSize_(rotated) {
        const canvas = this.getCanvas_();
        const isPortrait = canvas.width < canvas.height !== rotated;
        const orientedWidth = rotated ? canvas.height : canvas.width;
        const orientedHeight = rotated ? canvas.width : canvas.height;
        const cssWidth = Math.min(isPortrait ? PORTRAIT_WIDTH : LANDSCAPE_WIDTH, Math.trunc(orientedWidth / window.devicePixelRatio));
        const scale = cssWidth / orientedWidth;
        const cssHeight = Math.trunc(orientedHeight * scale);
        return {
            width: cssWidth,
            height: cssHeight
        }
    }
    focusAndScroll() {
        this.scrollIntoView({
            block: "nearest"
        });
        this.focus({
            preventScroll: true
        })
    }
    isPainted() {
        return this.hasAttribute(PAINTED_ATTRIBUTE)
    }
    setPainted() {
        this.toggleAttribute(PAINTED_ATTRIBUTE, true)
    }
    onClick_() {
        this.fire("change-page", {
            page: this.pageNumber - 1,
            origin: ChangePageOrigin.THUMBNAIL
        })
    }
    styleCanvas_(canvas) {
        assert(this.clockwiseRotations >= 0 && this.clockwiseRotations < 4);
        const div = this.shadowRoot.querySelector("#thumbnail");
        const degreesRotated = this.clockwiseRotations * 90;
        canvas.style.transform = `rotate(${degreesRotated}deg)`;
        const rotated = this.clockwiseRotations % 2 !== 0;
        const cssSize = this.getThumbnailCssSize_(rotated);
        div.style.width = `${cssSize.width}px`;
        div.style.height = `${cssSize.height}px`;
        canvas.style.width = `${rotated ? cssSize.height : cssSize.width}px`;
        canvas.style.height = `${rotated ? cssSize.width : cssSize.height}px`
    }
}
customElements.define(ViewerThumbnailElement.is, ViewerThumbnailElement);
let instance$a = null;
function getCss$8() {
    return instance$a || (instance$a = [...[], css`:host(:focus){outline:0}#thumbnails{box-sizing:border-box;height:100%;overflow:auto;padding-bottom:24px;padding-inline-end:var(--viewer-thumbnail-bar-padding-inline-end);text-align:center}viewer-thumbnail{padding-top:24px}`])
}
function getHtml$7() {
    return html`
<div id="thumbnails" ?hidden="${!this.isPluginActive_}" role="tablist">
  ${this.computePageNumbers_().map((item => html`
    <viewer-thumbnail tabindex="0" role="tab"
        aria-label="${this.getAriaLabel_(item)}"
        aria-selected="${this.isActivePage_(item)}"
        .clockwiseRotations="${this.clockwiseRotations}"
        .isActive="${this.isActivePage_(item)}"
        .pageNumber="${item}">
    </viewer-thumbnail>`))}
</div>`
}
class ViewerThumbnailBarElement extends CrLitElement {
    static get is() {
        return "viewer-thumbnail-bar"
    }
    static get styles() {
        return getCss$8()
    }
    render() {
        return getHtml$7.bind(this)()
    }
    static get properties() {
        return {
            activePage: {
                type: Number
            },
            clockwiseRotations: {
                type: Number
            },
            docLength: {
                type: Number
            },
            isPluginActive_: {
                type: Boolean
            }
        }
    }
    constructor() {
        super();
        this.activePage = 0;
        this.clockwiseRotations = 0;
        this.docLength = 0;
        this.isPluginActive_ = false;
        this.intersectionObserver_ = null;
        this.pluginController_ = PluginController.getInstance();
        this.tracker_ = new EventTracker;
        this.inTest = false;
        this.isPluginActive_ = this.pluginController_.isActive;
        this.tracker_.add(this.pluginController_.getEventTarget(), PluginControllerEventType.IS_ACTIVE_CHANGED, (e => this.isPluginActive_ = e.detail));
        this.tracker_.add(this.pluginController_.getEventTarget(), PluginControllerEventType.UPDATE_INK_THUMBNAIL, this.handleUpdateInkThumbnail_.bind(this))
    }
    firstUpdated() {
        this.addEventListener("focus", this.onFocus_);
        this.addEventListener("keydown", this.onKeydown_);
        const thumbnailsDiv = this.$.thumbnails;
        this.intersectionObserver_ = new IntersectionObserver((entries => {
            entries.forEach((entry => {
                const thumbnail = entry.target;
                if (!entry.isIntersecting) {
                    thumbnail.clearImage();
                    return
                }
                if (thumbnail.isPainted()) {
                    return
                }
                thumbnail.setPainted();
                if (!this.isPluginActive_ || this.inTest) {
                    return
                }
                this.pluginController_.requestThumbnail(thumbnail.pageNumber - 1).then((response => {
                    const array = new Uint8ClampedArray(response.imageData);
                    const imageData = new ImageData(array,response.width);
                    thumbnail.image = imageData
                }
                ))
            }
            ))
        }
        ),{
            root: thumbnailsDiv,
            rootMargin: "500% 0% 100%"
        });
        FocusOutlineManager.forDocument(document)
    }
    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has("activePage")) {
            if (this.shadowRoot.activeElement) {
                this.getThumbnailForPage(this.activePage).focusAndScroll()
            }
        }
        if (changedProperties.has("docLength")) {
            assert(this.intersectionObserver_);
            this.shadowRoot.querySelectorAll("viewer-thumbnail").forEach((thumbnail => this.intersectionObserver_.observe(thumbnail)))
        }
    }
    clickThumbnailForPage(pageNumber) {
        const thumbnail = this.getThumbnailForPage(pageNumber);
        if (!thumbnail) {
            return
        }
        thumbnail.getClickTarget().click()
    }
    getThumbnailForPage(pageNumber) {
        return this.shadowRoot.querySelector(`viewer-thumbnail:nth-child(${pageNumber})`)
    }
    computePageNumbers_() {
        return Array.from({
            length: this.docLength
        }, ( (_, i) => i + 1))
    }
    getAriaLabel_(pageNumber) {
        return loadTimeData.getStringF("thumbnailPageAriaLabel", pageNumber)
    }
    isActivePage_(page) {
        return this.activePage === page
    }
    onFocus_() {
        const focusOutlineManager = FocusOutlineManager.forDocument(document);
        if (!focusOutlineManager.visible) {
            return
        }
        const activeThumbnail = this.shadowRoot.querySelector("viewer-thumbnail[is-active]");
        if (activeThumbnail) {
            activeThumbnail.focus();
            return
        }
        const firstThumbnail = this.shadowRoot.querySelector("viewer-thumbnail");
        if (!firstThumbnail) {
            return
        }
        firstThumbnail.focus()
    }
    onKeydown_(e) {
        switch (e.key) {
        case "Tab":
            if (e.shiftKey) {
                this.focus();
                return
            }
            const lastThumbnail = this.shadowRoot.querySelector("viewer-thumbnail:last-of-type");
            assert(lastThumbnail);
            lastThumbnail.focus({
                preventScroll: true
            });
            break;
        case "ArrowRight":
        case "ArrowDown":
            e.preventDefault();
            this.clickThumbnailForPage(this.activePage + 1);
            break;
        case "ArrowLeft":
        case "ArrowUp":
            e.preventDefault();
            this.clickThumbnailForPage(this.activePage - 1);
            break
        }
    }
    handleUpdateInkThumbnail_(e) {
        const data = e.detail;
        const thumbnail = this.getThumbnailForPage(data.pageNumber);
        if (thumbnail) {
            const array = new Uint8ClampedArray(data.imageData);
            thumbnail.ink2Image = new ImageData(array,data.width)
        }
    }
}
customElements.define(ViewerThumbnailBarElement.is, ViewerThumbnailBarElement);
let instance$9 = null;
function getCss$7() {
    return instance$9 || (instance$9 = [...[getCss$o(), getCss$r(), getCss$d()], css`:host{--sidenav-selected-tab-color:var(--google-blue-300);background-color:var(--viewer-side-background-color);display:flex;height:100%;min-width:var(--viewer-pdf-sidenav-width);overflow:hidden;width:var(--viewer-pdf-sidenav-width)}#icons{display:flex;flex-direction:column;min-width:64px}#content{color:#fff;flex:1;overflow-x:hidden}#icons:not([hidden])+#content{--viewer-thumbnail-bar-padding-inline-end:28px}.selected cr-icon-button{--cr-icon-button-fill-color:var(--sidenav-selected-tab-color)}.button-wrapper{--button-wrapper-height:36px;--button-wrapper-margin:12px;--button-wrapper-total-height:calc(
      var(--button-wrapper-height) + var(--button-wrapper-margin));align-items:center;display:flex;height:var(--button-wrapper-height);margin:var(--button-wrapper-margin) 0;width:100%}.cr-vertical-tab{--cr-vertical-tab-selected-color:var(--sidenav-selected-tab-color)}.cr-vertical-tab::before{transform:translateY(var(--button-wrapper-total-height));transition:transform 250ms cubic-bezier(.4,0,.2,1)}.cr-vertical-tab.selected+.cr-vertical-tab::before{transform:translateY(calc(-1 * var(--button-wrapper-total-height)))}.cr-vertical-tab.selected::before{transform:translateY(0)}cr-icon-button{margin:0 auto}`])
}
function getHtml$6() {
    return html`
<div id="icons" ?hidden="${this.hideIcons_()}" role="tablist"
    @keydown="${this.onKeydown_}">
  ${this.tabs_.map((item => html`<div class="button-wrapper cr-vertical-tab
        ${this.getTabSelectedClass_(item.id)}">
      <cr-icon-button .ironIcon="${item.icon}" role="tab"
          title="${item.title}" data-tab-id="${item.id}"
          aria-selected="${this.getTabAriaSelected_(item.id)}"
          tabindex="${this.getTabIndex_(item.id)}"
          @click="${this.onTabClick_}">
      </cr-icon-button>
    </div>`))}
</div>
<div id="content">
  <viewer-thumbnail-bar id="thumbnail-bar" tabindex="0"
      ?hidden="${this.hideThumbnailView_()}" .activePage="${this.activePage}"
      .clockwiseRotations="${this.clockwiseRotations}"
      .docLength="${this.docLength}">
  </viewer-thumbnail-bar>
  <viewer-document-outline id="outline"
      ?hidden="${this.hideOutlineView_()}" .bookmarks="${this.bookmarks}">
  </viewer-document-outline>
  <viewer-attachment-bar id="attachment-bar"
      ?hidden="${this.hideAttachmentView_()}"
      .attachments="${this.attachments}">
  </viewer-attachment-bar>
</div>`
}
var TabId;
(function(TabId) {
    TabId[TabId["THUMBNAIL"] = 0] = "THUMBNAIL";
    TabId[TabId["OUTLINE"] = 1] = "OUTLINE";
    TabId[TabId["ATTACHMENT"] = 2] = "ATTACHMENT"
}
)(TabId || (TabId = {}));
class ViewerPdfSidenavElement extends CrLitElement {
    constructor() {
        super(...arguments);
        this.activePage = 0;
        this.attachments = [];
        this.bookmarks = [];
        this.clockwiseRotations = 0;
        this.docLength = 0;
        this.pdfCr23Enabled = false;
        this.selectedTab_ = 0;
        this.tabs_ = []
    }
    static get is() {
        return "viewer-pdf-sidenav"
    }
    static get styles() {
        return getCss$7()
    }
    render() {
        return getHtml$6.bind(this)()
    }
    static get properties() {
        return {
            activePage: {
                type: Number
            },
            attachments: {
                type: Array
            },
            bookmarks: {
                type: Array
            },
            clockwiseRotations: {
                type: Number
            },
            docLength: {
                type: Number
            },
            pdfCr23Enabled: {
                type: Boolean
            },
            strings: {
                type: Object
            },
            selectedTab_: {
                type: Number
            },
            tabs_: {
                type: Array
            }
        }
    }
    willUpdate(changedProperties) {
        super.willUpdate(changedProperties);
        if (changedProperties.has("bookmarks") || changedProperties.has("attachments")) {
            this.tabs_ = this.computeTabs_()
        }
    }
    iconsetName_() {
        return this.pdfCr23Enabled ? "pdf-cr23" : "pdf"
    }
    computeTabs_() {
        const tabs = [{
            id: TabId.THUMBNAIL,
            icon: this.iconsetName_() + ":thumbnails",
            title: this.strings ? loadTimeData.getString("tooltipThumbnails") : ""
        }];
        if (this.bookmarks.length > 0) {
            tabs.push({
                id: TabId.OUTLINE,
                icon: this.iconsetName_() + ":doc-outline",
                title: this.strings ? loadTimeData.getString("tooltipDocumentOutline") : ""
            })
        }
        if (this.attachments.length > 0) {
            tabs.push({
                id: TabId.ATTACHMENT,
                icon: this.iconsetName_() + ":attach-file",
                title: this.strings ? loadTimeData.getString("tooltipAttachments") : ""
            })
        }
        return tabs
    }
    hideIcons_() {
        return this.tabs_.length === 1
    }
    getTabAriaSelected_(tabId) {
        return this.tabs_[this.selectedTab_].id === tabId ? "true" : "false"
    }
    getTabIndex_(tabId) {
        return this.tabs_[this.selectedTab_].id === tabId ? "0" : "-1"
    }
    getTabSelectedClass_(tabId) {
        return this.tabs_[this.selectedTab_].id === tabId ? "selected" : ""
    }
    onTabClick_(e) {
        const tabId = e.currentTarget.dataset["tabId"];
        assert(tabId !== undefined);
        switch (Number.parseInt(tabId, 10)) {
        case TabId.THUMBNAIL:
            record(UserAction.SELECT_SIDENAV_THUMBNAILS);
            this.selectedTab_ = 0;
            break;
        case TabId.OUTLINE:
            record(UserAction.SELECT_SIDENAV_OUTLINE);
            this.selectedTab_ = 1;
            break;
        case TabId.ATTACHMENT:
            record(UserAction.SELECT_SIDENAV_ATTACHMENT);
            this.selectedTab_ = this.tabs_.length - 1;
            break
        }
    }
    hideThumbnailView_() {
        return this.tabs_[this.selectedTab_].id !== TabId.THUMBNAIL
    }
    hideOutlineView_() {
        return this.tabs_[this.selectedTab_].id !== TabId.OUTLINE
    }
    hideAttachmentView_() {
        return this.tabs_[this.selectedTab_].id !== TabId.ATTACHMENT
    }
    onKeydown_(e) {
        if (this.tabs_.length === 1 || e.key !== "ArrowUp" && e.key !== "ArrowDown") {
            return
        }
        e.preventDefault();
        e.stopPropagation();
        if (e.key === "ArrowUp") {
            if (this.selectedTab_ === 0) {
                this.selectedTab_ = this.tabs_.length - 1
            } else {
                this.selectedTab_--
            }
        } else {
            if (this.selectedTab_ === this.tabs_.length - 1) {
                this.selectedTab_ = 0
            } else {
                this.selectedTab_++
            }
        }
    }
}
customElements.define(ViewerPdfSidenavElement.is, ViewerPdfSidenavElement);
let instance$8 = null;
function getCss$6() {
    return instance$8 || (instance$8 = [...[getCss$d()], css`:host{--break-padding:8px}cr-dialog::part(dialog){width:fit-content}table{border-spacing:0}.break>td{--break-color:var(--google-grey-300);border-bottom:1px solid var(--break-color);padding-bottom:var(--break-padding)}.break+tr>td{padding-top:var(--break-padding)}.name{color:var(--cr-primary-text-color);padding-inline-end:12px;vertical-align:top}.value{color:var(--cr-secondary-text-color);max-width:300px;min-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#keywords{white-space:normal}`])
}
function getHtml$5() {
    return html`<!--_html_template_start_-->
<cr-dialog id="dialog" show-on-attach>
  <div slot="title">Document properties</div>
  <div slot="body">
    <table>
      <tr>
        <td class="name">File name:</td>
        <td class="value" id="file-name">${this.fileName}</td>
      </tr>
      <tr class="break">
        <td class="name">File size:</td>
        <td class="value" id="file-size">${this.documentMetadata.fileSize}</td>
      </tr>
      <tr>
        <td class="name">Title:</td>
        <td class="value" id="title">
          ${this.getOrPlaceholder_(this.documentMetadata.title)}
        </td>
      </tr>
      <tr>
        <td class="name">Author:</td>
        <td class="value" id="author">
          ${this.getOrPlaceholder_(this.documentMetadata.author)}
        </td>
      </tr>
      <tr>
        <td class="name">Subject:</td>
        <td class="value" id="subject">
          ${this.getOrPlaceholder_(this.documentMetadata.subject)}
        </td>
      </tr>
      <tr>
        <td class="name">Keywords:</td>
        <td class="value" id="keywords">
          ${this.getOrPlaceholder_(this.documentMetadata.keywords)}
        </td>
      </tr>
      <tr>
        <td class="name">Created:</td>
        <td class="value" id="created">
          ${this.getOrPlaceholder_(this.documentMetadata.creationDate)}
        </td>
      </tr>
      <tr>
        <td class="name">Modified:</td>
        <td class="value" id="modified">
          ${this.getOrPlaceholder_(this.documentMetadata.modDate)}
        </td>
      </tr>
      <tr class="break">
        <td class="name">Application:</td>
        <td class="value" id="application">
          ${this.getOrPlaceholder_(this.documentMetadata.creator)}
        </td>
      </tr>
      <tr>
        <td class="name">PDF producer:</td>
        <td class="value" id="pdf-producer">
          ${this.getOrPlaceholder_(this.documentMetadata.producer)}
        </td>
      </tr>
      <tr>
        <td class="name">PDF version:</td>
        <td class="value" id="pdf-version">
          ${this.getOrPlaceholder_(this.documentMetadata.version)}
        </td>
      </tr>
      <tr>
        <td class="name">Page count:</td>
        <td class="value" id="page-count">${this.pageCount}</td>
      </tr>
      <tr class="break">
        <td class="name">Page size:</td>
        <td class="value" id="page-size">
          ${this.getOrPlaceholder_(this.documentMetadata.pageSize)}
        </td>
      </tr>
      <tr>
        <td class="name">Fast web view:</td>
        <td class="value" id="fast-web-view">
          ${this.getFastWebViewValue_()}
        </td>
      </tr>
    </table>
  </div>
  <div slot="button-container">
    <cr-button id="close" class="action-button" @click="${this.onClickClose_}">
      Close
    </cr-button>
  </div>
</cr-dialog>
<!--_html_template_end_-->`
}
class ViewerPropertiesDialogElement extends CrLitElement {
    constructor() {
        super(...arguments);
        this.documentMetadata = {
            author: "",
            canSerializeDocument: false,
            creationDate: "",
            creator: "",
            fileSize: "",
            keywords: "",
            linearized: false,
            modDate: "",
            pageSize: "",
            producer: "",
            subject: "",
            title: "",
            version: ""
        };
        this.fileName = "";
        this.pageCount = 0
    }
    static get is() {
        return "viewer-properties-dialog"
    }
    static get styles() {
        return getCss$6()
    }
    render() {
        return getHtml$5.bind(this)()
    }
    static get properties() {
        return {
            documentMetadata: {
                type: Object
            },
            fileName: {
                type: String
            },
            pageCount: {
                type: Number
            },
            strings: {
                type: Object
            }
        }
    }
    getFastWebViewValue_() {
        if (!this.strings) {
            return ""
        }
        return loadTimeData.getString(this.documentMetadata.linearized ? "propertiesFastWebViewYes" : "propertiesFastWebViewNo")
    }
    getOrPlaceholder_(value) {
        return value || "-"
    }
    onClickClose_() {
        this.$.dialog.close()
    }
}
customElements.define(ViewerPropertiesDialogElement.is, ViewerPropertiesDialogElement);
let instance$7 = null;
function getCss$5() {
    return instance$7 || (instance$7 = [...[getCss$o()], css`:host{--cr-icon-button-margin-end:0;--cr-icon-button-margin-start:0;background-color:var(--viewer-side-background-color);padding-top:8px;width:288px}:host>*{padding-inline:16px}h2{font:normal 400 13px Roboto,sans-serif;color:var(--google-grey-100);margin:0;margin-inline-start:14px}cr-icon-button{--cr-icon-button-fill-color:var(--viewer-icon-ink-fill-color)}cr-icon-button[data-selected=true]{--cr-icon-button-fill-color:var(--viewer-icon-ink-selected-fill-color);background-color:var(--viewer-icon-ink-selected-background-color)}#brush-options{padding-top:27px}ink-brush-selector{border-bottom:1px solid var(--viewer-border-color);padding-bottom:12px;padding-top:4px}ink-color-selector,ink-size-selector{margin:16px 0 32px;padding:0 8px}`])
}
function getHtml$4() {
    return html`
    <ink-brush-selector .currentType="${this.currentType}">
    </ink-brush-selector>
    <div id="brush-options">
      <h2>Size</h2>
      <ink-size-selector .currentSize="${this.currentSize}"
          .currentType="${this.currentType}"></ink-size-selector>
      ${this.shouldShowColorOptions_() ? html`
        <h2>Color</h2>
        <ink-color-selector .currentColor="${this.currentColor}"
            .currentType="${this.currentType}">
        </ink-color-selector>` : ""}
    </div>
  `
}
class ViewerSidePanelElement extends CrLitElement {
    static get is() {
        return "viewer-side-panel"
    }
    static get styles() {
        return getCss$5()
    }
    render() {
        return getHtml$4.bind(this)()
    }
    static get properties() {
        return {
            currentColor: {
                type: Object
            },
            currentSize: {
                type: Number
            },
            currentType: {
                type: String
            }
        }
    }
    constructor() {
        super();
        this.currentSize = 0;
        this.currentType = AnnotationBrushType.PEN;
        record(UserAction.OPEN_INK2_SIDE_PANEL)
    }
    shouldShowColorOptions_() {
        return this.currentType !== AnnotationBrushType.ERASER
    }
}
customElements.define(ViewerSidePanelElement.is, ViewerSidePanelElement);
let instance$6 = null;
function getCss$4() {
    return instance$6 || (instance$6 = [...[getCss$r()], css`:host{display:block;width:200px;position:relative;overflow:hidden}#progressContainer{position:relative}#progressContainer,:host([indeterminate]) #primaryProgress::after{height:var(--cr-progress-height,4px)}#primaryProgress,:host([indeterminate]) #primaryProgress::after{position:absolute;top:0;right:0;bottom:0;left:0}#progressContainer,:host([indeterminate]) #primaryProgress::after{background:var(--cr-progress-container-color,var(--google-grey-300))}#primaryProgress{transform-origin:left center;transform:scaleX(0);will-change:transform}#primaryProgress{background:var(--cr-progress-active-color,var(--google-green-500))}:host([disabled]) #primaryProgress{background:var(--cr-progress-disabled-active-color,var(--google-grey-500))}:host([indeterminate]:not([disabled])) #primaryProgress{transform-origin:right center;animation:indeterminate-bar var(--cr-progress-indeterminate-cycle-duration,2s) linear infinite}:host([indeterminate]:not([disabled])) #primaryProgress::after{content:"";transform-origin:center center;animation:indeterminate-splitter var(--cr-progress-indeterminate-cycle-duration,2s) linear infinite}@keyframes indeterminate-bar{0%{transform:scaleX(1) translateX(-100%)}50%{transform:scaleX(1) translateX(0)}75%{transform:scaleX(1) translateX(0);animation-timing-function:cubic-bezier(.28,.62,.37,.91)}100%{transform:scaleX(0) translateX(0)}}@keyframes indeterminate-splitter{0%{transform:scaleX(.75) translateX(-125%)}30%{transform:scaleX(.75) translateX(-125%);animation-timing-function:cubic-bezier(.42,0,.6,.8)}90%{transform:scaleX(.75) translateX(125%)}100%{transform:scaleX(.75) translateX(125%)}}`])
}
function getHtml$3() {
    return html`
    <div id="progressContainer">
      <div id="primaryProgress"></div>
    </div>`
}
class CrProgressElement extends CrLitElement {
    constructor() {
        super(...arguments);
        this.value = 0;
        this.min = 0;
        this.max = 100;
        this.step = 1;
        this.indeterminate = false;
        this.disabled = false
    }
    static get is() {
        return "cr-progress"
    }
    static get styles() {
        return getCss$4()
    }
    render() {
        return getHtml$3.bind(this)()
    }
    static get properties() {
        return {
            value: {
                type: Number
            },
            min: {
                type: Number
            },
            max: {
                type: Number
            },
            step: {
                type: Number
            },
            indeterminate: {
                type: Boolean,
                reflect: true
            },
            disabled: {
                type: Boolean,
                reflect: true
            }
        }
    }
    firstUpdated(changedProperties) {
        super.firstUpdated(changedProperties);
        if (!this.hasAttribute("role")) {
            this.setAttribute("role", "progressbar")
        }
    }
    willUpdate(changedProperties) {
        super.willUpdate(changedProperties);
        if (changedProperties.has("min") || changedProperties.has("max") || changedProperties.has("value") || changedProperties.has("step")) {
            const previous = changedProperties.get("value") || 0;
            const clampedValue = this.clampValue_(this.value);
            this.value = Number.isNaN(clampedValue) ? previous : clampedValue
        }
    }
    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has("min") || changedProperties.has("max") || changedProperties.has("value") || changedProperties.has("step")) {
            const ratio = (this.value - this.min) / (this.max - this.min);
            this.$.primaryProgress.style.transform = `scaleX(${ratio})`;
            this.setAttribute("aria-valuemin", this.min.toString());
            this.setAttribute("aria-valuemax", this.max.toString())
        }
        if (changedProperties.has("indeterminate") || changedProperties.has("value")) {
            if (this.indeterminate) {
                this.removeAttribute("aria-valuenow")
            } else {
                this.setAttribute("aria-valuenow", this.value.toString())
            }
        }
        if (changedProperties.has("disabled")) {
            this.setAttribute("aria-disabled", this.disabled ? "true" : "false")
        }
    }
    clampValue_(value) {
        return Math.min(this.max, Math.max(this.min, this.calcStep_(value)))
    }
    calcStep_(value) {
        value = Number.parseFloat(value.toString());
        if (!this.step) {
            return value
        }
        const numSteps = Math.round((value - this.min) / this.step);
        if (this.step < 1) {
            return numSteps / (1 / this.step) + this.min
        } else {
            return numSteps * this.step + this.min
        }
    }
}
customElements.define(CrProgressElement.is, CrProgressElement);
let instance$5 = null;
function getCss$3() {
    return instance$5 || (instance$5 = [...[getCss$o()], css`:host{--viewer-pdf-toolbar-height:56px;box-shadow:0 -2px 8px rgba(0,0,0,.09),0 4px 8px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.3),0 2px 6px rgba(0,0,0,.15);position:relative}:host-context([pdfcr23enabled]){box-shadow:none}:host([more-menu-open_]) #more{background-color:var(--active-button-bg);border-radius:50%}#toolbar{align-items:center;background-color:var(--viewer-pdf-toolbar-background-color);color:#fff;display:flex;height:var(--viewer-pdf-toolbar-height);padding:0 16px}#title{font-size:.87rem;font-weight:500;margin-inline-start:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#actionMenuTrigger{margin-inline-end:6px}#start{align-items:center;display:flex;overflow:hidden;padding-inline-end:20px}#end,#start{flex:1}#center{align-items:center;display:flex}#end{display:flex;justify-content:flex-end;padding-inline-start:20px;text-align:end;white-space:nowrap}.vertical-separator{background:rgba(255,255,255,.3);height:15px;width:1px}:host-context([pdfcr23enabled]) .vertical-separator{height:20px}#zoom-controls{align-items:center;display:flex;padding:0 4px}#zoom-controls input::selection{background-color:var(--viewer-text-input-selection-color)}@media(max-width:600px){#title,#zoom-controls input{display:none}}@media(max-width:500px){#fit,#start{display:none}}@media(max-width:420px){#center{display:none}#end{padding-inline-start:initial;text-align:center}}viewer-page-selector{display:inline-flex;height:36px;margin-inline-end:20px}input,viewer-page-selector::part(input){max-height:var(--viewer-pdf-toolbar-height)}input{background:rgba(0,0,0,.5);border:none;caret-color:currentColor;color:inherit;font-family:inherit;line-height:inherit;margin:0 4px;outline:0;padding:0 4px;text-align:center;width:5ch}#fit{margin-inline-start:12px}cr-progress{--cr-progress-active-color:var(--google-blue-300);--cr-progress-container-color:transparent;--cr-progress-height:3px;bottom:0;position:absolute;width:100%}#center,#end,cr-progress{transition:opacity .1s cubic-bezier(0,0,.2,1)}:host([loading_]) #center,:host([loading_]) #end,:host([loading_]) #menuButton,cr-progress{opacity:0;visibility:hidden}#center,#end,#menuButton,:host([loading_]) cr-progress{opacity:1;visibility:visible}#annotate{margin-inline-end:4px}:host([annotation-mode]) #annotate{background-color:var(--active-button-bg);border-radius:50%}#annotate-controls{align-items:center;display:flex;margin-inline-start:6px}#annotate-controls #annotate{margin-inline:0}:host([annotation-mode]) #annotate-controls #annotate{--cr-icon-button-fill-color:var(--viewer-icon-ink-selected-fill-color)}#annotate-controls .vertical-separator{margin-inline:6px}#more,#print{margin-inline-start:4px}.dropdown-item{padding-inline-end:16px;padding-inline-start:12px}.check-container{margin-inline-end:12px;width:16px}cr-action-menu hr{border:none;border-top:var(--cr-separator-line)}`])
}
function getHtml$2() {
    return html`<!--_html_template_start_--><div id="toolbar">
  <div id="start">
    <cr-icon-button id="sidenavToggle" iron-icon="${this.menuIcon_()}" title="Menu" aria-label="Menu" aria-expanded="${this.getAriaExpanded_()}" @click="${this.onSidenavToggleClick_}">
    </cr-icon-button>
    <span id="title">${this.docTitle}</span>
  </div>
  <div id="center">
    <viewer-page-selector .docLength="${this.docLength}" .pageNo="${this.pageNo}">
    </viewer-page-selector>
    <span class="vertical-separator"></span>
    <span id="zoom-controls">
      <cr-icon-button iron-icon="${this.iconsetName_()}:remove" title="Zoom out" ?disabled="${this.isAtMinimumZoom_()}" aria-label="Zoom out" @click="${this.onZoomOutClick_}">
      </cr-icon-button>
      <input type="text" value="100%" aria-label="Zoom level" @change="${this.onZoomChange_}" @pointerup="${this.onZoomInputPointerup_}" @blur="${this.onZoomChange_}">
      
      <cr-icon-button iron-icon="${this.iconsetName_()}:add" title="Zoom in" ?disabled="${this.isAtMaximumZoom_()}" aria-label="Zoom in" @click="${this.onZoomInClick_}">
      </cr-icon-button>
    </span>
    <span class="vertical-separator"></span>
    <cr-icon-button id="fit" .ironIcon="${this.fitToButtonIcon_()}" title="${this.getFitToButtonTooltip_()}" aria-label="${this.getFitToButtonTooltip_()}" @click="${this.onFitToButtonClick_}">
    </cr-icon-button>
    <cr-icon-button id="rotate" .ironIcon="${this.iconsetName_()}:rotate-left" suppress-rtl-flip aria-label="Rotate counterclockwise" title="Rotate counterclockwise" @click="${this.onRotateClick_}">
    </cr-icon-button>

    ${this.showInk2Buttons_() ? html`
      <span id="annotate-controls">
        <span class="vertical-separator"></span>
        <cr-icon-button id="annotate" iron-icon="pdf:annotate" @click="${this.onAnnotationClick_}" aria-label="Draw" ?disabled="${!this.annotationAvailable}" title="Draw"></cr-icon-button>
        <span class="vertical-separator"></span>
        <cr-icon-button id="undo" ?disabled="${!this.canUndoAnnotation_}" iron-icon="${this.iconsetName_()}:undo" @click="${this.undo}" aria-label="Undo" title="Undo"></cr-icon-button>
        <cr-icon-button id="redo" ?disabled="${!this.canRedoAnnotation_}" iron-icon="${this.iconsetName_()}:redo" @click="${this.redo}" aria-label="Redo" title="Redo"></cr-icon-button>
      </span>` : ""}

  </div>
  <div id="end">
  
    <viewer-download-controls id="downloads" .hasEdits="${this.hasEdits}" .hasEnteredAnnotationMode="${this.hasEnteredAnnotationMode}" .hasInk2Edits="${this.hasInk2Edits}" .isFormFieldFocused="${this.isFormFieldFocused_()}">
    </viewer-download-controls>
    <cr-icon-button id="print" iron-icon="${this.printIcon_()}" ?hidden="${!this.printingEnabled}" title="Print" aria-label="Print" @click="${this.onPrintClick_}">
    </cr-icon-button>
    <cr-icon-button id="more" iron-icon="${this.moreIcon_()}" title="More actions" aria-label="More actions" @click="${this.onMoreClick_}"></cr-icon-button>
  </div>
</div>
<cr-progress id="progress" .value="${this.loadProgress}" ?hidden="${!this.loading_}">
</cr-progress>

<cr-action-menu id="menu" @open-changed="${this.onMoreOpenChanged_}">
  <button id="two-page-view-button" class="dropdown-item" @click="${this.toggleTwoPageViewClick_}" role="checkbox" aria-checked="${this.getAriaChecked_(this.twoUpViewEnabled)}">
    <span class="check-container">
      <cr-icon icon="${this.iconsetName_()}:check" ?hidden="${!this.twoUpViewEnabled}"></cr-icon>
    </span>
    Two page view
  </button>

  <button id="show-annotations-button" class="dropdown-item" @click="${this.toggleDisplayAnnotations_}" role="checkbox" aria-checked="${this.getAriaChecked_(this.displayAnnotations_)}">
    <span class="check-container">
      <cr-icon icon="${this.iconsetName_()}:check" ?hidden="${!this.displayAnnotations_}">
      </cr-icon>
    </span>
    Annotations
  </button>

  <hr>

  <button id="present-button" class="dropdown-item" @click="${this.onPresentClick_}" ?disabled="${!this.presentationModeAvailable_()}">
    <span class="check-container" aria-hidden="true"></span>
    Present
  </button>

  <button id="properties-button" class="dropdown-item" @click="${this.onPropertiesClick_}">
    <span class="check-container" aria-hidden="true"></span>
    Document properties
  </button>
</cr-action-menu>


<!--_html_template_end_-->`
}
class ViewerToolbarElement extends CrLitElement {
    static get is() {
        return "viewer-toolbar"
    }
    static get styles() {
        return getCss$3()
    }
    render() {
        return getHtml$2.bind(this)()
    }
    static get properties() {
        return {
            annotationAvailable: {
                type: Boolean
            },
            annotationMode: {
                type: Boolean,
                reflect: true
            },
            canRedoAnnotation_: {
                type: Boolean
            },
            canUndoAnnotation_: {
                type: Boolean
            },
            docTitle: {
                type: String
            },
            docLength: {
                type: Number
            },
            embeddedViewer: {
                type: Boolean
            },
            hasEdits: {
                type: Boolean
            },
            hasEnteredAnnotationMode: {
                type: Boolean
            },
            hasInk2Edits: {
                type: Boolean
            },
            formFieldFocus: {
                type: String
            },
            loadProgress: {
                type: Number
            },
            loading_: {
                type: Boolean,
                reflect: true
            },
            pageNo: {
                type: Number
            },
            pdfAnnotationsEnabled: {
                type: Boolean
            },
            pdfCr23Enabled: {
                type: Boolean
            },
            pdfInk2Enabled: {
                type: Boolean
            },
            printingEnabled: {
                type: Boolean
            },
            rotated: {
                type: Boolean
            },
            strings: {
                type: Object
            },
            viewportZoom: {
                type: Number
            },
            zoomBounds: {
                type: Object
            },
            sidenavCollapsed: {
                type: Boolean
            },
            twoUpViewEnabled: {
                type: Boolean
            },
            moreMenuOpen_: {
                type: Boolean,
                reflect: true
            },
            fittingType_: {
                type: Number
            },
            viewportZoomPercent_: {
                type: Number
            }
        }
    }
    constructor() {
        super();
        this.docTitle = "";
        this.docLength = 0;
        this.embeddedViewer = false;
        this.hasEdits = false;
        this.hasEnteredAnnotationMode = false;
        this.hasInk2Edits = false;
        this.formFieldFocus = FormFieldFocusType.NONE;
        this.loadProgress = 0;
        this.pageNo = 0;
        this.pdfAnnotationsEnabled = false;
        this.pdfCr23Enabled = false;
        this.printingEnabled = false;
        this.rotated = false;
        this.viewportZoom = 0;
        this.zoomBounds = {
            min: 0,
            max: 0
        };
        this.sidenavCollapsed = false;
        this.twoUpViewEnabled = false;
        this.displayAnnotations_ = true;
        this.fittingType_ = FittingType.FIT_TO_PAGE;
        this.moreMenuOpen_ = false;
        this.loading_ = true;
        this.viewportZoomPercent_ = 0;
        this.annotationAvailable = false;
        this.annotationMode = false;
        this.pdfInk2Enabled = false;
        this.canRedoAnnotation_ = false;
        this.canUndoAnnotation_ = false;
        this.currentStroke = 0;
        this.mostRecentStroke = 0;
        this.pluginController_ = PluginController.getInstance();
        this.tracker_ = new EventTracker;
        this.tracker_.add(this.pluginController_.getEventTarget(), PluginControllerEventType.FINISH_INK_STROKE, this.handleFinishInkStroke_.bind(this))
    }
    willUpdate(changedProperties) {
        super.willUpdate(changedProperties);
        if (changedProperties.has("loadProgress")) {
            this.loading_ = this.loadProgress < 100
        }
        if (changedProperties.has("viewportZoom")) {
            this.viewportZoomPercent_ = Math.round(100 * this.viewportZoom)
        }
        if (changedProperties.has("formFieldFocus")) {
            this.updateCanUndoRedo_()
        }
    }
    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has("viewportZoom")) {
            this.getZoomInput_().value = `${this.viewportZoomPercent_}%`
        }
    }
    onSidenavToggleClick_() {
        record(UserAction.TOGGLE_SIDENAV);
        this.dispatchEvent(new CustomEvent("sidenav-toggle-click"))
    }
    iconsetName_() {
        return this.pdfCr23Enabled ? "pdf-cr23" : "pdf"
    }
    fitToButtonIcon_() {
        return this.iconsetName_() + (this.fittingType_ === FittingType.FIT_TO_PAGE ? ":fit-to-height" : ":fit-to-width")
    }
    menuIcon_() {
        return this.pdfCr23Enabled ? "pdf-cr23:menu" : "cr20:menu"
    }
    moreIcon_() {
        return this.pdfCr23Enabled ? "pdf-cr23:more" : "cr:more-vert"
    }
    printIcon_() {
        return this.pdfCr23Enabled ? "pdf-cr23:print" : "cr:print"
    }
    getFitToButtonTooltip_() {
        if (!this.strings) {
            return ""
        }
        return loadTimeData.getString(this.fittingType_ === FittingType.FIT_TO_PAGE ? "tooltipFitToPage" : "tooltipFitToWidth")
    }
    showInk2Buttons_() {
        return this.pdfInk2Enabled && this.pdfAnnotationsEnabled
    }
    onPrintClick_() {
        this.dispatchEvent(new CustomEvent("print"))
    }
    onRotateClick_() {
        this.dispatchEvent(new CustomEvent("rotate-left"))
    }
    toggleDisplayAnnotations_() {
        record(UserAction.TOGGLE_DISPLAY_ANNOTATIONS);
        this.displayAnnotations_ = !this.displayAnnotations_;
        this.dispatchEvent(new CustomEvent("display-annotations-changed",{
            detail: this.displayAnnotations_
        }));
        this.$.menu.close()
    }
    onPresentClick_() {
        record(UserAction.PRESENT);
        this.$.menu.close();
        this.dispatchEvent(new CustomEvent("present-click"))
    }
    onPropertiesClick_() {
        record(UserAction.PROPERTIES);
        this.$.menu.close();
        this.dispatchEvent(new CustomEvent("properties-click"))
    }
    getAriaChecked_(checked) {
        return checked ? "true" : "false"
    }
    getAriaExpanded_() {
        return this.sidenavCollapsed ? "false" : "true"
    }
    toggleTwoPageViewClick_() {
        const newTwoUpViewEnabled = !this.twoUpViewEnabled;
        this.dispatchEvent(new CustomEvent("two-up-view-changed",{
            detail: newTwoUpViewEnabled
        }));
        this.$.menu.close()
    }
    onZoomInClick_() {
        this.dispatchEvent(new CustomEvent("zoom-in"))
    }
    onZoomOutClick_() {
        this.dispatchEvent(new CustomEvent("zoom-out"))
    }
    forceFit(fittingType) {
        this.fittingType_ = fittingType === FittingType.FIT_TO_WIDTH ? FittingType.FIT_TO_PAGE : FittingType.FIT_TO_WIDTH
    }
    fitToggle() {
        const newState = this.fittingType_ === FittingType.FIT_TO_PAGE ? FittingType.FIT_TO_WIDTH : FittingType.FIT_TO_PAGE;
        this.dispatchEvent(new CustomEvent("fit-to-changed",{
            detail: this.fittingType_
        }));
        this.fittingType_ = newState
    }
    onFitToButtonClick_() {
        this.fitToggle()
    }
    getZoomInput_() {
        return this.shadowRoot.querySelector("#zoom-controls input")
    }
    onZoomChange_() {
        const input = this.getZoomInput_();
        let value = Number.parseInt(input.value, 10);
        value = Math.max(Math.min(value, this.zoomBounds.max), this.zoomBounds.min);
        if (this.sendZoomChanged_(value)) {
            return
        }
        const zoomString = `${this.viewportZoomPercent_}%`;
        input.value = zoomString
    }
    sendZoomChanged_(value) {
        if (Number.isNaN(value)) {
            return false
        }
        if (Math.abs(this.viewportZoom * 100 - value) < .5) {
            return false
        }
        this.dispatchEvent(new CustomEvent("zoom-changed",{
            detail: value
        }));
        return true
    }
    onZoomInputPointerup_(e) {
        e.target.select()
    }
    onMoreClick_() {
        const anchor = this.shadowRoot.querySelector("#more");
        this.$.menu.showAt(anchor, {
            anchorAlignmentX: AnchorAlignment.CENTER,
            anchorAlignmentY: AnchorAlignment.AFTER_END,
            noOffset: true
        })
    }
    onMoreOpenChanged_(e) {
        this.moreMenuOpen_ = e.detail.value
    }
    isAtMinimumZoom_() {
        return this.zoomBounds !== undefined && this.viewportZoomPercent_ === this.zoomBounds.min
    }
    isAtMaximumZoom_() {
        return this.zoomBounds !== undefined && this.viewportZoomPercent_ === this.zoomBounds.max
    }
    onAnnotationClick_() {
        if (this.pdfInk2Enabled) {
            this.toggleAnnotation();
            return
        }
    }
    toggleAnnotation() {
        const newAnnotationMode = !this.annotationMode;
        this.dispatchEvent(new CustomEvent("annotation-mode-toggled",{
            detail: newAnnotationMode
        }));
        if (this.pdfInk2Enabled) {
            return
        }
        if (newAnnotationMode && !this.displayAnnotations_) {
            this.toggleDisplayAnnotations_()
        }
    }
    handleFinishInkStroke_() {
        this.currentStroke++;
        this.mostRecentStroke = this.currentStroke;
        this.canUndoAnnotation_ = true;
        this.canRedoAnnotation_ = false
    }
    undo() {
        if (!this.canUndoAnnotation_) {
            return
        }
        assert(this.currentStroke > 0);
        assert(this.formFieldFocus !== FormFieldFocusType.TEXT);
        this.pluginController_.undo();
        this.currentStroke--;
        this.updateCanUndoRedo_();
        this.dispatchEvent(new CustomEvent("strokes-updated",{
            detail: this.currentStroke,
            bubbles: true,
            composed: true
        }));
        record(UserAction.UNDO_INK2)
    }
    redo() {
        if (!this.canRedoAnnotation_) {
            return
        }
        assert(this.currentStroke < this.mostRecentStroke);
        assert(this.formFieldFocus !== FormFieldFocusType.TEXT);
        this.pluginController_.redo();
        this.currentStroke++;
        this.updateCanUndoRedo_();
        this.dispatchEvent(new CustomEvent("strokes-updated",{
            detail: this.currentStroke,
            bubbles: true,
            composed: true
        }));
        record(UserAction.REDO_INK2)
    }
    updateCanUndoRedo_() {
        const isTextFormFieldFocused = this.formFieldFocus === FormFieldFocusType.TEXT;
        this.canUndoAnnotation_ = !isTextFormFieldFocused && this.currentStroke > 0;
        this.canRedoAnnotation_ = !isTextFormFieldFocused && this.currentStroke < this.mostRecentStroke
    }
    resetStrokesForTesting() {
        this.currentStroke = 0;
        this.mostRecentStroke = 0;
        this.updateCanUndoRedo_();
        this.dispatchEvent(new CustomEvent("strokes-updated",{
            detail: 0,
            bubbles: true,
            composed: true
        }))
    }
    isFormFieldFocused_() {
        return this.formFieldFocus !== FormFieldFocusType.NONE
    }
    presentationModeAvailable_() {
        return !this.embeddedViewer
    }
}
customElements.define(ViewerToolbarElement.is, ViewerToolbarElement);
class NavigatorDelegateImpl {
    constructor(browserApi) {
        this.browserApi_ = browserApi
    }
    navigateInCurrentTab(url) {
        this.browserApi_.navigateInCurrentTab(url)
    }
    navigateInNewTab(url, active) {
        if (chrome.tabs) {
            chrome.tabs.create({
                url: url,
                active: active
            })
        } else {
            window.open(url)
        }
    }
    navigateInNewWindow(url) {
        if (chrome.windows) {
            chrome.windows.create({
                url: url
            })
        } else {
            window.open(url, "_blank")
        }
    }
    isAllowedLocalFileAccess(url) {
        return new Promise((resolve => {
            chrome.pdfViewerPrivate.isAllowedLocalFileAccess(url, (result => resolve(result)))
        }
        ))
    }
}
class PdfNavigator {
    constructor(originalUrl, viewport, paramsParser, navigatorDelegate) {
        this.originalUrl_ = null;
        try {
            this.originalUrl_ = new URL(originalUrl)
        } catch (err) {
            console.warn("Invalid original URL")
        }
        this.viewport_ = viewport;
        this.paramsParser_ = paramsParser;
        this.navigatorDelegate_ = navigatorDelegate
    }
    async navigate(urlString, disposition) {
        if (urlString.length === 0) {
            return Promise.resolve()
        }
        if (urlString[0] === "#" && this.originalUrl_) {
            const newUrl = new URL(this.originalUrl_.href);
            newUrl.hash = urlString;
            urlString = newUrl.href
        }
        if (!urlString.includes("://") && !urlString.includes("mailto:")) {
            urlString = await this.guessUrlWithoutScheme_(urlString)
        }
        let url = null;
        try {
            url = new URL(urlString)
        } catch (err) {
            return Promise.reject(err)
        }
        if (!await this.isValidUrl_(url)) {
            return Promise.resolve()
        }
        let whenDone = Promise.resolve();
        switch (disposition) {
        case WindowOpenDisposition.CURRENT_TAB:
            whenDone = this.paramsParser_.getViewportFromUrlParams(url.href).then(this.onViewportReceived_.bind(this));
            break;
        case WindowOpenDisposition.NEW_BACKGROUND_TAB:
            this.navigatorDelegate_.navigateInNewTab(url.href, false);
            break;
        case WindowOpenDisposition.NEW_FOREGROUND_TAB:
            this.navigatorDelegate_.navigateInNewTab(url.href, true);
            break;
        case WindowOpenDisposition.NEW_WINDOW:
            this.navigatorDelegate_.navigateInNewWindow(url.href);
            break;
        case WindowOpenDisposition.SAVE_TO_DISK:
            whenDone = this.paramsParser_.getViewportFromUrlParams(url.href).then(this.onViewportReceived_.bind(this));
            break
        }
        return whenDone
    }
    onViewportReceived_(viewportPosition) {
        let newUrl = null;
        try {
            newUrl = new URL(viewportPosition.url)
        } catch (err) {}
        const pageNumber = viewportPosition.page;
        if (pageNumber !== undefined && this.originalUrl_ && newUrl && this.originalUrl_.origin === newUrl.origin && this.originalUrl_.pathname === newUrl.pathname) {
            this.viewport_.goToPage(pageNumber)
        } else {
            this.navigatorDelegate_.navigateInCurrentTab(viewportPosition.url)
        }
    }
    async isValidUrl_(url) {
        const validSchemes = ["http:", "https:", "ftp:", "file:", "mailto:"];
        if (!validSchemes.includes(url.protocol)) {
            return false
        }
        if (url.protocol === "file:" && this.originalUrl_ && this.originalUrl_.protocol !== "file:") {
            return this.navigatorDelegate_.isAllowedLocalFileAccess(this.originalUrl_.toString())
        }
        return true
    }
    async guessUrlWithoutScheme_(url) {
        if (!this.originalUrl_ || this.originalUrl_.protocol === "mailto:" || !await this.isValidUrl_(this.originalUrl_)) {
            return url
        }
        if (url.startsWith("/")) {
            return this.originalUrl_.origin + url
        }
        if (url.startsWith("\\")) {
            url = "./" + url
        }
        if (!url.startsWith(".")) {
            const domainSeparatorIndex = url.indexOf("/");
            const domainName = domainSeparatorIndex === -1 ? url : url.substr(0, domainSeparatorIndex);
            const domainDotCount = (domainName.match(/\./g) || []).length;
            if (domainDotCount >= 2) {
                return "http://" + url
            }
        }
        return new URL(url,this.originalUrl_.href).href
    }
}
var WindowOpenDisposition;
(function(WindowOpenDisposition) {
    WindowOpenDisposition[WindowOpenDisposition["CURRENT_TAB"] = 1] = "CURRENT_TAB";
    WindowOpenDisposition[WindowOpenDisposition["NEW_FOREGROUND_TAB"] = 3] = "NEW_FOREGROUND_TAB";
    WindowOpenDisposition[WindowOpenDisposition["NEW_BACKGROUND_TAB"] = 4] = "NEW_BACKGROUND_TAB";
    WindowOpenDisposition[WindowOpenDisposition["NEW_WINDOW"] = 6] = "NEW_WINDOW";
    WindowOpenDisposition[WindowOpenDisposition["SAVE_TO_DISK"] = 7] = "SAVE_TO_DISK"
}
)(WindowOpenDisposition || (WindowOpenDisposition = {}));
Object.assign(window, {
    PdfNavigator: PdfNavigator,
    WindowOpenDisposition: WindowOpenDisposition
});
let instance$4 = null;
function getCss$2() {
    return instance$4 || (instance$4 = [...[], css`:host{--cr-toast-background:var(--color-toast-background,
      var(--cr-fallback-color-inverse-surface));--cr-toast-button-color:var(--color-toast-button,
      var(--cr-fallback-color-inverse-primary));--cr-toast-text-color:var(--color-toast-foreground,
      var(--cr-fallback-color-inverse-on-surface))}:host{align-items:center;background:var(--cr-toast-background);border-radius:8px;bottom:0;box-shadow:0 2px 4px 0 rgba(0,0,0,.28);box-sizing:border-box;display:flex;line-height:20px;margin:24px;max-width:var(--cr-toast-max-width,568px);min-height:52px;min-width:288px;opacity:0;padding:0 16px;position:fixed;transform:translateY(100px);transition:opacity .3s,transform .3s;visibility:hidden;z-index:1}:host-context([dir=ltr]){left:0}:host-context([dir=rtl]){right:0}:host([open]){opacity:1;transform:translateY(0);visibility:visible}:host ::slotted(*){color:var(--cr-toast-text-color)}:host ::slotted(cr-button){background-color:transparent!important;border:none!important;color:var(--cr-toast-button-color)!important;margin-inline-start:32px!important;min-width:52px!important;padding:8px!important}:host ::slotted(cr-button:hover){background-color:transparent!important}::slotted(cr-button:last-of-type){margin-inline-end:-8px}`])
}
function getHtml$1() {
    return html`<slot></slot>`
}
class CrToastElement extends CrLitElement {
    constructor() {
        super(...arguments);
        this.duration = 0;
        this.open = false;
        this.hideTimeoutId_ = null
    }
    static get is() {
        return "cr-toast"
    }
    static get styles() {
        return getCss$2()
    }
    render() {
        return getHtml$1.bind(this)()
    }
    static get properties() {
        return {
            duration: {
                type: Number
            },
            open: {
                type: Boolean,
                reflect: true
            }
        }
    }
    willUpdate(changedProperties) {
        super.willUpdate(changedProperties);
        if (changedProperties.has("duration") || changedProperties.has("open")) {
            this.resetAutoHide_()
        }
    }
    resetAutoHide_() {
        if (this.hideTimeoutId_ !== null) {
            window.clearTimeout(this.hideTimeoutId_);
            this.hideTimeoutId_ = null
        }
        if (this.open && this.duration !== 0) {
            this.hideTimeoutId_ = window.setTimeout(( () => {
                this.hide()
            }
            ), this.duration)
        }
    }
    async show() {
        const shouldResetAutohide = this.open;
        this.removeAttribute("role");
        this.removeAttribute("aria-hidden");
        this.open = true;
        await this.updateComplete;
        this.setAttribute("role", "alert");
        if (shouldResetAutohide) {
            this.resetAutoHide_()
        }
    }
    async hide() {
        this.setAttribute("aria-hidden", "true");
        this.open = false;
        await this.updateComplete
    }
}
customElements.define(CrToastElement.is, CrToastElement);
class LocalStorageProxyImpl {
    getItem(key) {
        return window.localStorage.getItem(key)
    }
    setItem(key, value) {
        window.localStorage.setItem(key, value)
    }
    static getInstance() {
        return instance$3 || (instance$3 = new LocalStorageProxyImpl)
    }
}
let instance$3 = null;
let instance$2 = null;
function getCss$1() {
    return instance$2 || (instance$2 = [...[], css`.spinner{--cr-spinner-size:28px;mask-image:url(//resources/images/throbber_small.svg);mask-position:center;mask-repeat:no-repeat;mask-size:var(--cr-spinner-size) var(--cr-spinner-size);background-color:var(--cr-spinner-color,var(--google-blue-500));height:var(--cr-spinner-size);width:var(--cr-spinner-size)}@media (prefers-color-scheme:dark){.spinner{background-color:var(--cr-spinner-color,var(--google-blue-300))}}`])
}
let instance$1 = null;
function getCss() {
    return instance$1 || (instance$1 = [...[getCss$t(), getCss$r(), getCss$1()], css`:host{--viewer-pdf-sidenav-width:300px;display:flex;flex-direction:column;height:100%;width:100%}viewer-pdf-sidenav,viewer-toolbar{--pdf-toolbar-text-color:rgb(241, 241, 241)}viewer-side-panel{border-inline-start:1px solid var(--viewer-border-color)}viewer-toolbar{--active-button-bg:rgba(255, 255, 255, 0.24);z-index:1}@media(max-width:200px),(max-height:250px){viewer-toolbar{display:none}}#bottom{display:flex;justify-content:center}#sidenav-container{overflow:hidden;transition:transform 250ms cubic-bezier(.6,0,0,1),visibility 250ms;visibility:visible;width:var(--viewer-pdf-sidenav-width)}:host-context([pdfcr23enabled]) #sidenav-container{border-inline-end:1px solid var(--viewer-border-color)}#sidenav-container.floating{bottom:0;position:absolute;top:0;z-index:1}#sidenav-container[closed]{transform:translateX(-100%);transition:transform .2s cubic-bezier(.6,0,0,1),visibility .2s,width 0s .2s;visibility:hidden;width:0}:host-context([dir=rtl]) #sidenav-container[closed]{transform:translateX(100%)}@media(max-width:500px),(max-height:250px){#sidenav-container{display:none}}#content-focus-rectangle{border:2px solid var(--google-grey-500);border-radius:2px;box-sizing:border-box;height:100%;pointer-events:none;position:absolute;top:0;width:100%}viewer-ink-host{height:100%;position:absolute;width:100%}#container{display:flex;flex:1;overflow:hidden;position:relative}#plugin{position:initial}#content{height:100%;left:0;position:sticky;top:0;z-index:initial}#sizer{top:0;width:100%;z-index:initial}#main{flex:1;overflow:hidden;position:relative}#scroller{direction:ltr;height:100%;overflow:auto;position:relative}#scroller:fullscreen{overflow:hidden}.spinner{mask-image:url(chrome://resources/images/throbber_small.svg);margin-inline-end:10px}#searchifyProgress{--cr-toast-background:rgb(227, 227, 227);--cr-toast-text-color:rgb(31, 31, 31)}`])
}
function getHtml() {
    return html`<!--_html_template_start_--><viewer-toolbar id="toolbar" .annotationMode="${this.annotationMode_}" .docTitle="${this.title_}" .docLength="${this.docLength_}" .embeddedViewer="${this.embedded_}" .pageNo="${this.pageNo_}" .loadProgress="${this.loadProgress_}" .hasEdits="${this.hasEdits_}" .strings="${this.strings}" .hasEnteredAnnotationMode="${this.hasEnteredAnnotationMode_}" .hasInk2Edits="${this.hasInk2Edits_}" .printingEnabled="${this.printingEnabled_}" .rotated="${this.isRotated_()}" .formFieldFocus="${this.formFieldFocus_}" .sidenavCollapsed="${this.sidenavCollapsed_}" .twoUpViewEnabled="${this.twoUpViewEnabled_}" .viewportZoom="${this.viewportZoom_}" .zoomBounds="${this.zoomBounds_}" .annotationAvailable="${this.annotationAvailable_()}" .pdfAnnotationsEnabled="${this.pdfAnnotationsEnabled_}" .pdfCr23Enabled="${this.pdfCr23Enabled}" .pdfInk2Enabled="${this.pdfInk2Enabled_}" @change-page="${this.onChangePage_}" @display-annotations-changed="${this.onDisplayAnnotationsChanged_}" @fit-to-changed="${this.onFitToChanged}" @present-click="${this.onPresentClick_}" @properties-click="${this.onPropertiesClick_}" @sidenav-toggle-click="${this.onSidenavToggleClick_}" @two-up-view-changed="${this.onTwoUpViewChanged_}" @zoom-changed="${this.onZoomChanged}" @zoom-in="${this.onZoomIn}" @zoom-out="${this.onZoomOut}" @rotate-left="${this.rotateCounterclockwise}" @annotation-mode-toggled="${this.onAnnotationModeToggled_}" @print="${this.onPrint_}" @save="${this.onToolbarSave_}" @strokes-updated="${this.onStrokesUpdated_}" hidden>
</viewer-toolbar>

<div id="container">
  <div id="sidenav-container" ?closed="${this.sidenavCollapsed_}" ?hidden="${!this.toolbarEnabled_}">
    <viewer-pdf-sidenav id="sidenav" .activePage="${this.pageNo_}" .attachments="${this.attachments_}" .bookmarks="${this.bookmarks_}" .clockwiseRotations="${this.clockwiseRotations_}" .docLength="${this.docLength_}" .pdfCr23Enabled="${this.pdfCr23Enabled}" .strings="${this.strings}" @change-page="${this.onChangePage_}" @change-page-and-xy="${this.onChangePageAndXy_}" @navigate="${this.onNavigate_}" @save-attachment="${this.onSaveAttachment_}">
    </viewer-pdf-sidenav>
  </div>
  <div id="main">
    <div id="scroller">
      <div id="sizer"></div>
      <div id="content"></div>
    </div>
    <div id="content-focus-rectangle" ?hidden="${!this.documentHasFocus_}">
    </div>
    
      ${this.shouldShowInkBottomToolbar_() ? html`
        <div id="bottom">
          <viewer-bottom-toolbar .currentColor="${this.currentBrushColor_}" .currentSize="${this.currentBrushSize_}" .currentType="${this.currentBrushType_}" .strings="${this.strings}" @current-color-changed="${this.onBrushColorChanged_}" @current-size-changed="${this.onBrushSizeChanged_}" @current-type-changed="${this.onBrushTypeChanged_}">
          </viewer-bottom-toolbar>
        </div>` : ""}
    
  </div>
  
    ${this.shouldShowInkSidePanel_() ? html`
      <viewer-side-panel .currentColor="${this.currentBrushColor_}" .currentSize="${this.currentBrushSize_}" .currentType="${this.currentBrushType_}" @current-color-changed="${this.onBrushColorChanged_}" @current-size-changed="${this.onBrushSizeChanged_}" @current-type-changed="${this.onBrushTypeChanged_}">
      </viewer-side-panel>` : ""}
  
  <cr-toast id="searchifyProgress">
    <div class="spinner"></div>
    <span>Extracting text from PDF…</span>
  </cr-toast>
</div>

${this.showErrorDialog ? html`<viewer-error-dialog id="error-dialog">
</viewer-error-dialog>` : ""}

${this.showPasswordDialog_ ? html`<viewer-password-dialog id="password-dialog" @close="${this.onPasswordDialogClose_}" @password-submitted="${this.onPasswordSubmitted_}">
</viewer-password-dialog>` : ""}

${this.showPropertiesDialog_ ? html`<viewer-properties-dialog id="properties-dialog" .documentMetadata="${this.documentMetadata_}" .fileName="${this.fileName_}" .pageCount="${this.docLength_}" .strings="${this.strings}" @close="${this.onPropertiesDialogClose_}">
</viewer-properties-dialog>` : ""}
<!--_html_template_end_-->`
}
class PdfViewerPrivateProxyImpl {
    setPdfDocumentTitle(title) {
        chrome.pdfViewerPrivate.setPdfDocumentTitle(title)
    }
    static getInstance() {
        return instance || (instance = new PdfViewerPrivateProxyImpl)
    }
}
let instance = null;
var PostMessageDataType;
(function(PostMessageDataType) {
    PostMessageDataType[PostMessageDataType["GET_SELECTED_TEXT"] = 0] = "GET_SELECTED_TEXT";
    PostMessageDataType[PostMessageDataType["PRINT"] = 1] = "PRINT";
    PostMessageDataType[PostMessageDataType["SELECT_ALL"] = 2] = "SELECT_ALL"
}
)(PostMessageDataType || (PostMessageDataType = {}));
function getFilenameFromURL(url) {
    const mainUrl = url.split(/#|\?/)[0] || "";
    const components = mainUrl.split(/\/|\\/);
    const filename = components[components.length - 1] || "";
    try {
        return decodeURIComponent(filename)
    } catch (e) {
        if (e instanceof URIError) {
            return filename
        }
        throw e
    }
}
function eventToPromise(event, target) {
    return new Promise((resolve => listenOnce(target, event, (_e => resolve()))))
}
function hasFixedCtrlModifierOnly(e) {
    return e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey
}
const LOCAL_STORAGE_SIDENAV_COLLAPSED_KEY = "sidenavCollapsed";
const BACKGROUND_COLOR = 4283586137;
const CR23_BACKGROUND_COLOR = 4280821800;
class PdfViewerElement extends PdfViewerBaseElement {
    static get is() {
        return "pdf-viewer"
    }
    static get styles() {
        return getCss()
    }
    render() {
        return getHtml.bind(this)()
    }
    static get properties() {
        return {
            pdfCr23Enabled: {
                type: Boolean
            },
            showErrorDialog: {
                type: Boolean
            },
            strings: {
                type: Object
            },
            annotationMode_: {
                type: Boolean
            },
            attachments_: {
                type: Array
            },
            bookmarks_: {
                type: Array
            },
            canSerializeDocument_: {
                type: Boolean
            },
            clockwiseRotations_: {
                type: Number
            },
            currentBrushColor_: {
                type: Object
            },
            currentBrushSize_: {
                type: Number
            },
            currentBrushType_: {
                type: AnnotationBrushType
            },
            docLength_: {
                type: Number
            },
            documentHasFocus_: {
                type: Boolean
            },
            documentMetadata_: {
                type: Object
            },
            fileName_: {
                type: String
            },
            hadPassword_: {
                type: Boolean
            },
            hasEdits_: {
                type: Boolean
            },
            hasEnteredAnnotationMode_: {
                type: Boolean
            },
            hasInk2Edits_: {
                type: Boolean
            },
            formFieldFocus_: {
                type: String
            },
            loadProgress_: {
                type: Number
            },
            pageNo_: {
                type: Number
            },
            pdfAnnotationsEnabled_: {
                type: Boolean
            },
            pdfInk2Enabled_: {
                type: Boolean
            },
            pdfUseShowSaveFilePicker_: {
                type: Boolean
            },
            printingEnabled_: {
                type: Boolean
            },
            showPasswordDialog_: {
                type: Boolean
            },
            showPropertiesDialog_: {
                type: Boolean
            },
            sidenavCollapsed_: {
                type: Boolean
            },
            title_: {
                type: String
            },
            twoUpViewEnabled_: {
                type: Boolean
            },
            viewportZoom_: {
                type: Number
            },
            zoomBounds_: {
                type: Object
            }
        }
    }
    constructor() {
        super();
        this.beepCount = 0;
        this.annotationMode_ = false;
        this.attachments_ = [];
        this.bookmarks_ = [];
        this.canSerializeDocument_ = false;
        this.clockwiseRotations_ = 0;
        this.currentBrushSize_ = 0;
        this.currentBrushType_ = AnnotationBrushType.PEN;
        this.docLength_ = 0;
        this.documentHasFocus_ = false;
        this.documentMetadata_ = {
            author: "",
            canSerializeDocument: false,
            creationDate: "",
            creator: "",
            fileSize: "",
            keywords: "",
            linearized: false,
            modDate: "",
            pageSize: "",
            producer: "",
            subject: "",
            title: "",
            version: ""
        };
        this.embedded_ = false;
        this.fileName_ = "";
        this.hadPassword_ = false;
        this.hasEdits_ = false;
        this.hasEnteredAnnotationMode_ = false;
        this.hasInitializedBrush_ = false;
        this.hasInk2Edits_ = false;
        this.hasSavedEdits_ = false;
        this.formFieldFocus_ = FormFieldFocusType.NONE;
        this.loadProgress_ = 0;
        this.navigator_ = null;
        this.pageNo_ = 0;
        this.pdfAnnotationsEnabled_ = false;
        this.pdfInk2Enabled_ = false;
        this.pdfUseShowSaveFilePicker_ = false;
        this.pluginController_ = PluginController.getInstance();
        this.printingEnabled_ = false;
        this.restoreAnnotationMode_ = false;
        this.showBeforeUnloadDialog_ = false;
        this.showPasswordDialog_ = false;
        this.showPropertiesDialog_ = false;
        this.title_ = "";
        this.toolbarEnabled_ = false;
        this.twoUpViewEnabled_ = false;
        this.viewportZoom_ = 1;
        this.zoomBounds_ = {
            min: 0,
            max: 0
        };
        this.hasSearchifyText_ = false;
        this.sidenavCollapsed_ = Boolean(Number.parseInt(LocalStorageProxyImpl.getInstance().getItem(LOCAL_STORAGE_SIDENAV_COLLAPSED_KEY), 10))
    }
    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has("showErrorDialog") && this.showErrorDialog) {
            this.onErrorDialog_()
        }
    }
    connectedCallback() {
        super.connectedCallback();
        this.tracker.add(window, "beforeunload", this.onBeforeUnload_.bind(this));
        this.tracker.add(window, "resize", this.onResize_.bind(this))
    }
    disconnectedCallback() {
        this.tracker.removeAll();
        super.disconnectedCallback()
    }
    getBackgroundColor() {
        return this.pdfCr23Enabled ? CR23_BACKGROUND_COLOR : BACKGROUND_COLOR
    }
    setPluginSrc(plugin) {
        plugin.src = this.browserApi.getStreamInfo().streamUrl
    }
    init(browserApi) {
        this.initInternal(browserApi, this.$.scroller, this.$.sizer, this.$.content);
        this.fileName_ = getFilenameFromURL(this.originalUrl);
        this.title_ = this.fileName_;
        assert(this.paramsParser);
        this.toolbarEnabled_ = this.paramsParser.shouldShowToolbar(this.originalUrl);
        if (this.toolbarEnabled_) {
            this.$.toolbar.hidden = false
        }
        const showSidenav = this.paramsParser.shouldShowSidenav(this.originalUrl, this.sidenavCollapsed_);
        this.sidenavCollapsed_ = !showSidenav;
        this.navigator_ = new PdfNavigator(this.originalUrl,this.viewport,this.paramsParser,new NavigatorDelegateImpl(browserApi));
        if (this.pdfOopifEnabled) {
            chrome.pdfViewerPrivate.onSave.addListener(this.onSave_.bind(this))
        } else {
            chrome.mimeHandlerPrivate.onSave.addListener(this.onSave_.bind(this))
        }
        chrome.pdfViewerPrivate.onShouldUpdateViewport.addListener(this.handleMaybeUpdateViewport_.bind(this));
        this.embedded_ = this.browserApi.getStreamInfo().embedded;
        if (this.pdfOopifEnabled && !this.embedded_) {
            window.focus()
        }
    }
    handleKeyEvent(e) {
        if (shouldIgnoreKeyEvents() || e.defaultPrevented) {
            return
        }
        if (this.viewport.handleDirectionalKeyEvent(e, this.formFieldFocus_ !== FormFieldFocusType.NONE)) {
            return
        }
        if (document.fullscreenElement !== null) {
            if (hasCtrlModifier(e) && (e.key === "=" || e.key === "-" || e.key === "+")) {
                e.preventDefault()
            }
            return
        }
        switch (e.key) {
        case "a":
            if (hasCtrlModifierOnly(e)) {
                this.pluginController_.selectAll();
                e.preventDefault()
            }
            return
        }
        this.handleToolbarKeyEvent_(e)
    }
    handleToolbarKeyEvent_(e) {
        switch (e.key) {
        case "[":
            if (hasFixedCtrlModifierOnly(e)) {
                this.rotateCounterclockwise()
            }
            return;
        case "\\":
            if (hasFixedCtrlModifierOnly(e)) {
                this.$.toolbar.fitToggle()
            }
            return;
        case "]":
            if (hasFixedCtrlModifierOnly(e)) {
                this.rotateClockwise()
            }
            return;
        case "z":
            if (hasCtrlModifierOnly(e)) {
                this.$.toolbar.undo()
            }
            return;
        case "y":
            if (hasCtrlModifierOnly(e)) {
                this.$.toolbar.redo()
            }
            return
        }
    }
    async onAnnotationModeToggled_(e) {
        const annotationMode = e.detail;
        if (this.pdfInk2Enabled_) {
            if (!this.restoreAnnotationMode_) {
                record(annotationMode ? UserAction.ENTER_INK2_ANNOTATION_MODE : UserAction.EXIT_INK2_ANNOTATION_MODE)
            }
            this.pluginController_.setAnnotationMode(annotationMode);
            if (!this.hasInitializedBrush_) {
                this.hasInitializedBrush_ = true;
                const defaultBrushMessage = await this.pluginController_.getAnnotationBrush();
                this.setAnnotationBrush_(defaultBrushMessage.data)
            }
            this.annotationMode_ = annotationMode;
            return
        }
    }
    onDisplayAnnotationsChanged_(e) {
        assert(this.currentController);
        this.currentController.setDisplayAnnotations(e.detail)
    }
    async enterPresentationMode_() {
        if (this.pdfInk2Enabled_ && this.annotationMode_) {
            this.restoreAnnotationMode_ = true;
            this.$.toolbar.toggleAnnotation();
            assert(!this.annotationMode_)
        }
        const scroller = this.$.scroller;
        this.viewport.saveZoomState();
        await Promise.all([eventToPromise("fullscreenchange", scroller), scroller.requestFullscreen()]);
        this.forceFit(FittingType.FIT_TO_HEIGHT);
        this.viewport.setPresentationMode(true);
        this.pluginController_.setPresentationMode(true)
    }
    exitPresentationMode_() {
        assert(document.fullscreenElement === null);
        this.viewport.setPresentationMode(false);
        this.pluginController_.setPresentationMode(false);
        this.shadowRoot.querySelector("embed").focus();
        this.viewport.restoreZoomState();
        if (this.restoreAnnotationMode_) {
            this.$.toolbar.toggleAnnotation();
            assert(this.annotationMode_);
            this.restoreAnnotationMode_ = false
        }
    }
    async onPresentClick_() {
        await this.enterPresentationMode_();
        await eventToPromise("fullscreenchange", this.$.scroller);
        this.exitPresentationMode_()
    }
    onPropertiesClick_() {
        assert(!this.showPropertiesDialog_);
        this.showPropertiesDialog_ = true
    }
    onPropertiesDialogClose_() {
        assert(this.showPropertiesDialog_);
        this.showPropertiesDialog_ = false
    }
    onTwoUpViewChanged_(e) {
        const twoUpViewEnabled = e.detail;
        assert(this.currentController);
        this.currentController.setTwoUpView(twoUpViewEnabled);
        record(twoUpViewEnabled ? UserAction.TWO_UP_VIEW_ENABLE : UserAction.TWO_UP_VIEW_DISABLE)
    }
    goToPageAndXy_(origin, page, message) {
        this.viewport.goToPageAndXy(page, message.x, message.y);
        if (origin === ChangePageOrigin.BOOKMARK) {
            record(UserAction.FOLLOW_BOOKMARK)
        }
    }
    get bookmarks() {
        return this.bookmarks_
    }
    get pdfTitle() {
        return this.title_
    }
    setLoadState(loadState) {
        super.setLoadState(loadState);
        if (loadState === LoadState.FAILED) {
            this.closePasswordDialog_()
        }
    }
    updateProgress(progress) {
        if (this.toolbarEnabled_) {
            this.loadProgress_ = progress
        }
        super.updateProgress(progress);
        if (progress === 100) {
            this.maybeRenderTextDirectiveHighlights_(this.originalUrl)
        }
    }
    onErrorDialog_() {
        if (!chrome.tabs || this.browserApi.getStreamInfo().tabId === -1) {
            return
        }
        const errorDialog = this.shadowRoot.querySelector("#error-dialog");
        errorDialog.reloadFn = () => {
            chrome.tabs.reload(this.browserApi.getStreamInfo().tabId)
        }
    }
    closePasswordDialog_() {
        const passwordDialog = this.shadowRoot.querySelector("#password-dialog");
        if (passwordDialog) {
            passwordDialog.close()
        }
    }
    onPasswordDialogClose_() {
        this.showPasswordDialog_ = false
    }
    onPasswordSubmitted_(event) {
        this.pluginController_.getPasswordComplete(event.detail.password)
    }
    updateUiForViewportChange() {
        this.clockwiseRotations_ = this.viewport.getClockwiseRotations();
        this.pageNo_ = this.viewport.getMostVisiblePage() + 1;
        this.twoUpViewEnabled_ = this.viewport.twoUpViewEnabled();
        assert(this.currentController);
        this.currentController.viewportChanged()
    }
    handleStrings(strings) {
        super.handleStrings(strings);
        this.pdfAnnotationsEnabled_ = loadTimeData.getBoolean("pdfAnnotationsEnabled");
        this.pdfInk2Enabled_ = loadTimeData.getBoolean("pdfInk2Enabled");
        this.pdfUseShowSaveFilePicker_ = loadTimeData.getBoolean("pdfUseShowSaveFilePicker");
        this.printingEnabled_ = loadTimeData.getBoolean("printingEnabled");
        const presetZoomFactors = this.viewport.presetZoomFactors;
        assert(presetZoomFactors.length > 0);
        this.zoomBounds_.min = Math.round(presetZoomFactors[0] * 100);
        this.zoomBounds_.max = Math.round(presetZoomFactors[presetZoomFactors.length - 1] * 100)
    }
    handleScriptingMessage(message) {
        if (super.handleScriptingMessage(message)) {
            return true
        }
        if (this.delayScriptingMessage(message)) {
            return true
        }
        let messageType;
        switch (message.data.type.toString()) {
        case "getSelectedText":
            messageType = PostMessageDataType.GET_SELECTED_TEXT;
            this.pluginController_.getSelectedText().then(this.handleSelectedTextReply.bind(this));
            break;
        case "print":
            messageType = PostMessageDataType.PRINT;
            this.pluginController_.print();
            break;
        case "selectAll":
            messageType = PostMessageDataType.SELECT_ALL;
            this.pluginController_.selectAll();
            break;
        default:
            return false
        }
        recordEnumeration("PDF.PostMessageDataType", messageType, Object.keys(PostMessageDataType).length);
        return true
    }
    handlePluginMessage(e) {
        const data = e.detail;
        switch (data.type.toString()) {
        case "attachments":
            const attachmentsData = data;
            this.setAttachments_(attachmentsData.attachmentsData);
            return;
        case "beep":
            this.handleBeep_();
            return;
        case "bookmarks":
            const bookmarksData = data;
            this.setBookmarks_(bookmarksData.bookmarksData);
            return;
        case "documentDimensions":
            this.setDocumentDimensions(convertDocumentDimensionsMessage(data));
            return;
        case "documentFocusChanged":
            const hasFocusData = data;
            this.documentHasFocus_ = hasFocusData.hasFocus;
            return;
        case "email":
            const emailData = data;
            const href = "mailto:" + emailData.to + "?cc=" + emailData.cc + "&bcc=" + emailData.bcc + "&subject=" + emailData.subject + "&body=" + emailData.body;
            this.handleNavigate_(href, WindowOpenDisposition.CURRENT_TAB);
            return;
        case "executedEditCommand":
            const editCommandData = data;
            const editCommand = editCommandData.editCommand;
            switch (editCommand) {
            case "Cut":
                record(UserAction.CUT);
                return;
            case "Copy":
                record(UserAction.COPY);
                if (this.hasSearchifyText_) {
                    record(UserAction.COPY_SEARCHIFIED)
                }
                return;
            case "Paste":
                record(UserAction.PASTE);
                return
            }
            assertNotReached("Unknown executedEditCommand data received: " + editCommand);
        case "finishInkStroke":
            this.handleFinishInkStroke_();
            return;
        case "formFocusChange":
            const focusedData = convertFormFocusChangeMessage(data);
            this.formFieldFocus_ = focusedData.focused;
            return;
        case "getPassword":
            this.handlePasswordRequest_();
            return;
        case "loadProgress":
            const progressData = convertLoadProgressMessage(data);
            this.updateProgress(progressData.progress);
            return;
        case "metadata":
            const metadataData = data;
            this.setDocumentMetadata_(metadataData.metadataData);
            return;
        case "contentFocused":
            this.handleContentFocused_();
            return;
        case "navigate":
            const navigateData = data;
            this.handleNavigate_(navigateData.url, navigateData.disposition);
            return;
        case "sendKeyEvent":
            const keyEventData = data;
            const keyEvent = deserializeKeyEvent(keyEventData.keyEvent);
            keyEvent.fromPlugin = true;
            this.handleKeyEvent(keyEvent);
            return;
        case "setIsEditing":
            this.hasEdits_ = true;
            return;
        case "setHasSearchifyText":
            this.hasSearchifyText_ = true;
            return;
        case "showSearchifyInProgress":
            if (data.show) {
                this.$.searchifyProgress.show()
            } else {
                this.$.searchifyProgress.hide()
            }
            return;
        case "startedFindInPage":
            record(UserAction.FIND_IN_PAGE);
            if (this.hasSearchifyText_) {
                record(UserAction.FIND_IN_PAGE_SEARCHIFIED)
            }
            return;
        case "touchSelectionOccurred":
            this.sendScriptingMessage({
                type: "touchSelectionOccurred"
            });
            return;
        case "updateInk2Thumbnail":
            const thumbnailData = data;
            this.pluginController_.getEventTarget().dispatchEvent(new CustomEvent(PluginControllerEventType.UPDATE_INK_THUMBNAIL,{
                detail: thumbnailData
            }));
            return
        }
        assertNotReached("Unknown message type received: " + data.type)
    }
    forceFit(view) {
        this.$.toolbar.forceFit(view)
    }
    afterZoom(viewportZoom) {
        this.viewportZoom_ = viewportZoom
    }
    setDocumentDimensions(documentDimensions) {
        super.setDocumentDimensions(documentDimensions);
        this.closePasswordDialog_();
        if (this.toolbarEnabled_) {
            this.docLength_ = this.documentDimensions.pageDimensions.length
        }
    }
    handleBeep_() {
        this.beepCount += 1
    }
    handlePasswordRequest_() {
        if (!this.showPasswordDialog_) {
            this.showPasswordDialog_ = true;
            this.sendScriptingMessage({
                type: "passwordPrompted"
            })
        } else {
            const passwordDialog = this.shadowRoot.querySelector("#password-dialog");
            assert(passwordDialog);
            passwordDialog.deny()
        }
    }
    handleNavigate_(url, disposition) {
        this.navigator_.navigate(url, disposition)
    }
    handleMaybeUpdateViewport_(newUrl) {
        assert(this.paramsParser);
        this.paramsParser.getViewportFromUrlParams(newUrl).then((params => this.handleUrlParams(params)));
        this.maybeRenderTextDirectiveHighlights_(newUrl)
    }
    handleFinishInkStroke_() {
        this.hasInk2Edits_ = true;
        this.pluginController_.getEventTarget().dispatchEvent(new CustomEvent(PluginControllerEventType.FINISH_INK_STROKE));
        this.setShowBeforeUnloadDialog_(true)
    }
    handleContentFocused_() {
        this.pluginController_.getEventTarget().dispatchEvent(new CustomEvent(PluginControllerEventType.CONTENT_FOCUSED))
    }
    setAttachments_(attachments) {
        this.attachments_ = attachments
    }
    setBookmarks_(bookmarks) {
        this.bookmarks_ = bookmarks
    }
    setDocumentMetadata_(metadata) {
        this.documentMetadata_ = metadata;
        this.title_ = this.documentMetadata_.title || this.fileName_;
        if (this.pdfOopifEnabled && !this.embedded_) {
            PdfViewerPrivateProxyImpl.getInstance().setPdfDocumentTitle(this.title_)
        } else {
            document.title = this.title_
        }
        this.canSerializeDocument_ = this.documentMetadata_.canSerializeDocument
    }
    async onSaveAttachment_(e) {
        const index = e.detail;
        assert(this.attachments_[index] !== undefined);
        const size = this.attachments_[index].size;
        assert(size !== -1);
        let dataArray = [];
        if (size !== 0) {
            assert(this.currentController);
            const result = await this.currentController.saveAttachment(index);
            const MAX_FILE_SIZE = 100 * 1e3 * 1e3;
            const bufView = new Uint8Array(result.dataToSave);
            assert(bufView.length <= MAX_FILE_SIZE, `File too large to be saved: ${bufView.length} bytes.`);
            assert(bufView.length === size, `Received attachment size does not match its expected value: ${size} bytes.`);
            dataArray = [result.dataToSave]
        }
        const blob = new Blob(dataArray);
        const fileName = this.attachments_[index].name;
        if (this.pdfUseShowSaveFilePicker_) {
            try {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: fileName
                });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close()
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("window.showSaveFilePicker failed: " + error)
                }
            }
        } else {
            chrome.fileSystem.chooseEntry({
                type: "saveFile",
                suggestedName: fileName
            }, (entry => {
                if (chrome.runtime.lastError) {
                    if (chrome.runtime.lastError.message !== "User cancelled") {
                        console.error("chrome.fileSystem.chooseEntry failed: " + chrome.runtime.lastError.message)
                    }
                    return
                }
                entry.createWriter((writer => {
                    writer.write(blob)
                }
                ))
            }
            ))
        }
    }
    async onSave_(streamUrl) {
        if (streamUrl !== this.browserApi.getStreamInfo().streamUrl) {
            return
        }
        let shouldSaveWithAnnotation = this.hasEnteredAnnotationMode_;
        if (this.pdfInk2Enabled_) {
            shouldSaveWithAnnotation = this.hasInk2Edits_
        }
        let saveMode;
        if (shouldSaveWithAnnotation) {
            saveMode = SaveRequestType.ANNOTATION
        } else if (this.hasEdits_) {
            saveMode = SaveRequestType.EDITED
        } else if (this.hasSearchifyText_) {
            saveMode = SaveRequestType.SEARCHIFIED
        } else {
            saveMode = SaveRequestType.ORIGINAL
        }
        this.save_(saveMode)
    }
    onToolbarSave_(e) {
        this.save_(e.detail)
    }
    onChangePage_(e) {
        this.viewport.goToPage(e.detail.page);
        if (e.detail.origin === ChangePageOrigin.BOOKMARK) {
            record(UserAction.FOLLOW_BOOKMARK)
        } else if (e.detail.origin === ChangePageOrigin.PAGE_SELECTOR) {
            record(UserAction.PAGE_SELECTOR_NAVIGATE)
        } else if (e.detail.origin === ChangePageOrigin.THUMBNAIL) {
            record(UserAction.THUMBNAIL_NAVIGATE)
        }
    }
    onChangePageAndXy_(e) {
        const point = this.viewport.convertPageToScreen(e.detail.page, e.detail);
        this.goToPageAndXy_(e.detail.origin, e.detail.page, point)
    }
    onNavigate_(e) {
        const disposition = e.detail.newtab ? WindowOpenDisposition.NEW_BACKGROUND_TAB : WindowOpenDisposition.CURRENT_TAB;
        this.navigator_.navigate(e.detail.uri, disposition)
    }
    onSidenavToggleClick_() {
        this.sidenavCollapsed_ = !this.sidenavCollapsed_;
        const container = this.shadowRoot.querySelector("#sidenav-container");
        if (!this.sidenavCollapsed_) {
            container.classList.add("floating");
            container.addEventListener("transitionend", ( () => {
                container.classList.remove("floating")
            }
            ), {
                once: true
            })
        }
        LocalStorageProxyImpl.getInstance().setItem(LOCAL_STORAGE_SIDENAV_COLLAPSED_KEY, (this.sidenavCollapsed_ ? 1 : 0).toString())
    }
    onStrokesUpdated_(e) {
        this.hasInk2Edits_ = e.detail > 0;
        this.setShowBeforeUnloadDialog_(this.hasSavedEdits_ || this.hasInk2Edits_)
    }
    onBrushColorChanged_(e) {
        assert(this.currentBrushType_ !== AnnotationBrushType.ERASER);
        const newColor = e.detail.value;
        if (this.currentBrushColor_ === newColor) {
            return
        }
        this.currentBrushColor_ = newColor;
        this.setAnnotationBrushInPlugin_()
    }
    onBrushSizeChanged_(e) {
        const newSize = e.detail.value;
        if (this.currentBrushSize_ === newSize) {
            return
        }
        this.currentBrushSize_ = newSize;
        this.setAnnotationBrushInPlugin_()
    }
    async onBrushTypeChanged_(e) {
        const newType = e.detail.value;
        if (this.currentBrushType_ === newType) {
            return
        }
        assert(this.pluginController_);
        const brushMessage = await this.pluginController_.getAnnotationBrush(newType);
        this.setAnnotationBrush_(brushMessage.data);
        this.setAnnotationBrushInPlugin_()
    }
    setAnnotationBrush_(brush) {
        this.currentBrushColor_ = brush.color;
        this.currentBrushSize_ = brush.size;
        this.currentBrushType_ = brush.type
    }
    setAnnotationBrushInPlugin_() {
        assert(this.pluginController_);
        this.pluginController_.setAnnotationBrush({
            type: this.currentBrushType_,
            color: this.currentBrushColor_,
            size: this.currentBrushSize_
        })
    }
    maybeRenderTextDirectiveHighlights_(url) {
        assert(this.paramsParser);
        const textDirectives = this.paramsParser.getTextFragments(url);
        if (textDirectives.length > 0) {
            this.pluginController_.highlightTextFragments(textDirectives)
        }
    }
    async save_(requestType) {
        this.recordSaveMetrics_(requestType);
        assert(this.currentController);
        const result = await this.currentController.save(requestType);
        if (result === null) {
            return
        }
        let fileName = result.fileName;
        if (!fileName.toLowerCase().endsWith(".pdf")) {
            fileName = fileName + ".pdf"
        }
        const blob = new Blob([result.dataToSave],{
            type: "application/pdf"
        });
        if (this.pdfUseShowSaveFilePicker_) {
            try {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{
                        description: "PDF Files",
                        accept: {
                            "application/pdf": [".pdf"]
                        }
                    }]
                });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                this.onSaveSuccessful_(requestType)
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("window.showSaveFilePicker failed: " + error)
                }
            }
        } else {
            chrome.fileSystem.chooseEntry({
                type: "saveFile",
                accepts: [{
                    description: "*.pdf",
                    extensions: ["pdf"]
                }],
                suggestedName: fileName
            }, (entry => {
                if (chrome.runtime.lastError) {
                    if (chrome.runtime.lastError.message !== "User cancelled") {
                        console.error("chrome.fileSystem.chooseEntry failed: " + chrome.runtime.lastError.message)
                    }
                    return
                }
                entry.createWriter((writer => {
                    writer.write(blob);
                    this.onSaveSuccessful_(requestType)
                }
                ))
            }
            ))
        }
        if (this.pdfInk2Enabled_) {
            return
        }
    }
    onSaveSuccessful_(requestType) {
        this.setShowBeforeUnloadDialog_(false);
        this.hasSavedEdits_ = this.hasSavedEdits_ || requestType === SaveRequestType.EDITED
    }
    recordSaveMetrics_(requestType) {
        record(UserAction.SAVE);
        switch (requestType) {
        case SaveRequestType.ANNOTATION:
            record(UserAction.SAVE_WITH_ANNOTATION);
            if (this.pdfInk2Enabled_) {
                record(UserAction.SAVE_WITH_INK2_ANNOTATION)
            }
            break;
        case SaveRequestType.ORIGINAL:
            if (this.hasInk2Edits_) {
                record(UserAction.SAVE_ORIGINAL);
                break
            }
            record(this.hasEdits_ ? UserAction.SAVE_ORIGINAL : UserAction.SAVE_ORIGINAL_ONLY);
            break;
        case SaveRequestType.EDITED:
            record(UserAction.SAVE_EDITED);
            break;
        case SaveRequestType.SEARCHIFIED:
            record(UserAction.SAVE_SEARCHIFIED);
            break
        }
    }
    async onPrint_() {
        record(UserAction.PRINT);
        assert(this.currentController);
        this.currentController.print()
    }
    annotationAvailable_() {
        return this.canSerializeDocument_ && !this.hadPassword_
    }
    isRotated_() {
        return this.clockwiseRotations_ !== 0
    }
    shouldShowInkBottomToolbar_() {
        return this.inInk2AnnotationMode_() && !this.shouldShowInkSidePanel_()
    }
    shouldShowInkSidePanel_() {
        return this.inInk2AnnotationMode_() && window.innerWidth >= 960
    }
    onResize_() {
        if (this.inInk2AnnotationMode_()) {
            this.requestUpdate()
        }
    }
    inInk2AnnotationMode_() {
        return this.pdfInk2Enabled_ && this.annotationMode_
    }
    onBeforeUnload_(event) {
        if (this.pdfOopifEnabled && this.showBeforeUnloadDialog_) {
            BeforeUnloadProxyImpl.getInstance().preventDefault(event)
        }
    }
    setShowBeforeUnloadDialog_(showDialog) {
        if (this.showBeforeUnloadDialog_ === showDialog) {
            return
        }
        this.showBeforeUnloadDialog_ = showDialog;
        if (!this.pdfOopifEnabled) {
            chrome.mimeHandlerPrivate.setShowBeforeUnloadDialog(showDialog)
        }
    }
}
customElements.define(PdfViewerElement.is, PdfViewerElement);
export {AnnotationBrushType, BeforeUnloadProxyImpl, ChangePageOrigin, CrActionMenuElement, FittingType, FormFieldFocusType, InkBrushSelectorElement, InkColorSelectorElement, InkSizeSelectorElement, PAINTED_ATTRIBUTE, PdfNavigator, PdfViewerBaseElement, PdfViewerElement, PluginController, PluginControllerEventType, SaveRequestType, UserAction, ViewerAttachmentBarElement, ViewerAttachmentElement, ViewerBookmarkElement, ViewerBottomToolbarDropdownElement, ViewerBottomToolbarElement, ViewerDocumentOutlineElement, ViewerDownloadControlsElement, ViewerPageSelectorElement, ViewerPasswordDialogElement, ViewerPdfSidenavElement, ViewerPropertiesDialogElement, ViewerSidePanelElement, ViewerThumbnailBarElement, ViewerThumbnailElement, ViewerToolbarElement, WindowOpenDisposition, getFilenameFromURL, record, shouldIgnoreKeyEvents};
