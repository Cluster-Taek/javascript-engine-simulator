import { type EventScenario } from '../../lib/event-engine';

export const EVENT_PRESETS: EventScenario[] = [
  // 1. Basic Bubbling
  {
    name: 'Basic Bubbling',
    nameKey: 'eventPresets.basicBubbling',
    eventType: 'click',
    targetNodeId: 'button',
    code: `// Basic Bubbling
// Event bubbles from target → parent → document
const container = document.querySelector("#container");
const btn = document.querySelector(".btn");

document.addEventListener("click", function onDocClick(e) {
  console.log("document clicked");
});

container.addEventListener("click", function onDivClick(e) {
  console.log("div clicked");
});

btn.addEventListener("click", function onBtnClick(e) {
  console.log("button clicked");
});

// Click the button → bubbles: button → div → document
btn.click();`,
    tree: {
      root: {
        id: 'window',
        tag: 'window',
        label: 'window',
        listeners: [],
        children: [
          {
            id: 'document',
            tag: 'document',
            label: 'document',
            listeners: [
              {
                id: 'l-doc-b',
                type: 'click',
                useCapture: false,
                handler: 'onDocClick',
                handlerBody: 'console.log("document clicked")',
              },
            ],
            children: [
              {
                id: 'div',
                tag: 'div',
                label: 'div#container',
                listeners: [
                  {
                    id: 'l-div-b',
                    type: 'click',
                    useCapture: false,
                    handler: 'onDivClick',
                    handlerBody: 'console.log("div clicked")',
                  },
                ],
                children: [
                  {
                    id: 'button',
                    tag: 'button',
                    label: 'button.btn',
                    listeners: [
                      {
                        id: 'l-btn-b',
                        type: 'click',
                        useCapture: false,
                        handler: 'onBtnClick',
                        handlerBody: 'console.log("button clicked")',
                      },
                    ],
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },

  // 2. Capture Phase
  {
    name: 'Capture Phase',
    nameKey: 'eventPresets.capturePhase',
    eventType: 'click',
    targetNodeId: 'button',
    code: `// Capture Phase
// Third argument "true" enables capture mode
// Event flows top-down: document → div → button
const container = document.querySelector("#container");
const btn = document.querySelector(".btn");

document.addEventListener("click", function onDocCapture(e) {
  console.log("document capture");
}, true);  // ← useCapture: true

container.addEventListener("click", function onDivCapture(e) {
  console.log("div capture");
}, true);  // ← useCapture: true

btn.addEventListener("click", function onBtnCapture(e) {
  console.log("button capture");
}, true);  // ← useCapture: true

btn.click();`,
    tree: {
      root: {
        id: 'window',
        tag: 'window',
        label: 'window',
        listeners: [],
        children: [
          {
            id: 'document',
            tag: 'document',
            label: 'document',
            listeners: [
              {
                id: 'l-doc-c',
                type: 'click',
                useCapture: true,
                handler: 'onDocCapture',
                handlerBody: 'console.log("document capture")',
              },
            ],
            children: [
              {
                id: 'div',
                tag: 'div',
                label: 'div#container',
                listeners: [
                  {
                    id: 'l-div-c',
                    type: 'click',
                    useCapture: true,
                    handler: 'onDivCapture',
                    handlerBody: 'console.log("div capture")',
                  },
                ],
                children: [
                  {
                    id: 'button',
                    tag: 'button',
                    label: 'button.btn',
                    listeners: [
                      {
                        id: 'l-btn-c',
                        type: 'click',
                        useCapture: true,
                        handler: 'onBtnCapture',
                        handlerBody: 'console.log("button capture")',
                      },
                    ],
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },

  // 3. stopPropagation
  {
    name: 'stopPropagation',
    nameKey: 'eventPresets.stopPropagation',
    eventType: 'click',
    targetNodeId: 'button',
    code: `// stopPropagation
// Stops the event from reaching parent nodes
const container = document.querySelector("#container");
const btn = document.querySelector(".btn");

document.addEventListener("click", function onDocClick(e) {
  // This will NEVER run!
  console.log("document — never reached");
});

container.addEventListener("click", function onDivClick(e) {
  e.stopPropagation();  // ← stops here!
  // Event won't reach document
});

btn.addEventListener("click", function onBtnClick(e) {
  console.log("button clicked");
});

btn.click();
// Output: "button clicked" → div stops → document never fires`,
    tree: {
      root: {
        id: 'window',
        tag: 'window',
        label: 'window',
        listeners: [],
        children: [
          {
            id: 'document',
            tag: 'document',
            label: 'document',
            listeners: [
              {
                id: 'l-doc-b',
                type: 'click',
                useCapture: false,
                handler: 'onDocClick',
                handlerBody: 'console.log("document — never reached")',
              },
            ],
            children: [
              {
                id: 'div',
                tag: 'div',
                label: 'div#container',
                listeners: [
                  {
                    id: 'l-div-b',
                    type: 'click',
                    useCapture: false,
                    handler: 'onDivClick',
                    handlerBody: 'e.stopPropagation()',
                    stopsPropagation: true,
                  },
                ],
                children: [
                  {
                    id: 'button',
                    tag: 'button',
                    label: 'button.btn',
                    listeners: [
                      {
                        id: 'l-btn-b',
                        type: 'click',
                        useCapture: false,
                        handler: 'onBtnClick',
                        handlerBody: 'console.log("button clicked")',
                      },
                    ],
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },

  // 4. stopImmediatePropagation
  {
    name: 'stopImmediatePropagation',
    nameKey: 'eventPresets.stopImmediate',
    eventType: 'click',
    targetNodeId: 'button',
    code: `// stopImmediatePropagation
// Stops ALL remaining listeners — even on the same element
const btn = document.querySelector(".btn");

btn.addEventListener("click", function firstHandler(e) {
  e.stopImmediatePropagation();  // ← stops everything!
  console.log("first handler runs");
});

btn.addEventListener("click", function secondHandler(e) {
  // This will NEVER run!
  console.log("never called");
});

btn.addEventListener("click", function thirdHandler(e) {
  // This will NEVER run either!
  console.log("never called");
});

btn.click();
// Output: only "first handler runs"`,
    tree: {
      root: {
        id: 'window',
        tag: 'window',
        label: 'window',
        listeners: [],
        children: [
          {
            id: 'document',
            tag: 'document',
            label: 'document',
            listeners: [],
            children: [
              {
                id: 'div',
                tag: 'div',
                label: 'div#container',
                listeners: [],
                children: [
                  {
                    id: 'button',
                    tag: 'button',
                    label: 'button.btn',
                    listeners: [
                      {
                        id: 'l-btn-1',
                        type: 'click',
                        useCapture: false,
                        handler: 'firstHandler',
                        handlerBody: 'e.stopImmediatePropagation()',
                        stopsImmediatePropagation: true,
                      },
                      {
                        id: 'l-btn-2',
                        type: 'click',
                        useCapture: false,
                        handler: 'secondHandler',
                        handlerBody: 'console.log("never called")',
                      },
                      {
                        id: 'l-btn-3',
                        type: 'click',
                        useCapture: false,
                        handler: 'thirdHandler',
                        handlerBody: 'console.log("never called")',
                      },
                    ],
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },

  // 5. Event Delegation
  {
    name: 'Event Delegation',
    nameKey: 'eventPresets.eventDelegation',
    eventType: 'click',
    targetNodeId: 'li-2',
    code: `// Event Delegation
// Instead of adding a listener to every <li>,
// attach ONE listener to the parent <ul>
const list = document.querySelector("#list");

list.addEventListener("click", function onListClick(e) {
  // e.target is the actual clicked element
  if (e.target.tagName === "LI") {
    handle(e.target);
  }
});

// No listeners on individual <li> elements!
// <ul id="list">
//   <li class="item-1">Item 1</li>
//   <li class="item-2">Item 2</li>  ← click here
//   <li class="item-3">Item 3</li>
// </ul>

// Click li.item-2 → event bubbles up to ul → handler fires`,
    tree: {
      root: {
        id: 'window',
        tag: 'window',
        label: 'window',
        listeners: [],
        children: [
          {
            id: 'document',
            tag: 'document',
            label: 'document',
            listeners: [],
            children: [
              {
                id: 'ul',
                tag: 'ul',
                label: 'ul#list',
                listeners: [
                  {
                    id: 'l-ul-b',
                    type: 'click',
                    useCapture: false,
                    handler: 'onListClick',
                    handlerBody: 'if (e.target.tagName === "LI") handle(e.target)',
                  },
                ],
                children: [
                  { id: 'li-1', tag: 'li', label: 'li.item-1', listeners: [], children: [] },
                  { id: 'li-2', tag: 'li', label: 'li.item-2', listeners: [], children: [] },
                  { id: 'li-3', tag: 'li', label: 'li.item-3', listeners: [], children: [] },
                ],
              },
            ],
          },
        ],
      },
    },
  },

  // 6. preventDefault
  {
    name: 'preventDefault',
    nameKey: 'eventPresets.preventDefault',
    eventType: 'submit',
    targetNodeId: 'form',
    code: `// preventDefault
// Cancels the browser's default behavior
const form = document.querySelector("#login");

form.addEventListener("submit", function onSubmit(e) {
  e.preventDefault();  // ← prevents form submission!

  // Now we can handle it ourselves
  const data = new FormData(form);
  validate(data);
  console.log("Form validated, not submitted");
});

// <form id="login">
//   <input type="text" />
//   <button type="submit">Submit</button>
// </form>

// Without preventDefault → page reloads (default behavior)
// With preventDefault → we handle it in JS instead`,
    tree: {
      root: {
        id: 'window',
        tag: 'window',
        label: 'window',
        listeners: [],
        children: [
          {
            id: 'document',
            tag: 'document',
            label: 'document',
            listeners: [],
            children: [
              {
                id: 'div',
                tag: 'div',
                label: 'div#app',
                listeners: [],
                children: [
                  {
                    id: 'form',
                    tag: 'form',
                    label: 'form#login',
                    listeners: [
                      {
                        id: 'l-form',
                        type: 'submit',
                        useCapture: false,
                        handler: 'onSubmit',
                        handlerBody: 'e.preventDefault(); validate()',
                        preventsDefault: true,
                      },
                    ],
                    children: [
                      { id: 'input', tag: 'input', label: 'input[type=text]', listeners: [], children: [] },
                      { id: 'submit-btn', tag: 'button', label: 'button[type=submit]', listeners: [], children: [] },
                    ],
                    hasDefaultBehavior: 'Form submission',
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },

  // 7. Full Lifecycle
  {
    name: 'Full Lifecycle',
    nameKey: 'eventPresets.fullLifecycle',
    eventType: 'click',
    targetNodeId: 'button',
    code: `// Full Lifecycle — Capturing → Target → Bubbling
// Every node has BOTH capture and bubble listeners
const container = document.querySelector("#container");
const btn = document.querySelector(".btn");

// Window
window.addEventListener("click", function winCapture(e) {
  console.log("window capture");       // 1st
}, true);
window.addEventListener("click", function winBubble(e) {
  console.log("window bubble");        // 8th
});

// Document
document.addEventListener("click", function docCapture(e) {
  console.log("document capture");     // 2nd
}, true);
document.addEventListener("click", function docBubble(e) {
  console.log("document bubble");      // 7th
});

// Div
container.addEventListener("click", function divCapture(e) {
  console.log("div capture");          // 3rd
}, true);
container.addEventListener("click", function divBubble(e) {
  console.log("div bubble");           // 6th
});

// Button (target)
btn.addEventListener("click", function btnCapture(e) {
  console.log("button capture");       // 4th
}, true);
btn.addEventListener("click", function btnBubble(e) {
  console.log("button bubble");        // 5th
});

btn.click();`,
    tree: {
      root: {
        id: 'window',
        tag: 'window',
        label: 'window',
        listeners: [
          {
            id: 'l-win-c',
            type: 'click',
            useCapture: true,
            handler: 'winCapture',
            handlerBody: 'console.log("window capture")',
          },
          {
            id: 'l-win-b',
            type: 'click',
            useCapture: false,
            handler: 'winBubble',
            handlerBody: 'console.log("window bubble")',
          },
        ],
        children: [
          {
            id: 'document',
            tag: 'document',
            label: 'document',
            listeners: [
              {
                id: 'l-doc-c',
                type: 'click',
                useCapture: true,
                handler: 'docCapture',
                handlerBody: 'console.log("document capture")',
              },
              {
                id: 'l-doc-b',
                type: 'click',
                useCapture: false,
                handler: 'docBubble',
                handlerBody: 'console.log("document bubble")',
              },
            ],
            children: [
              {
                id: 'div',
                tag: 'div',
                label: 'div#container',
                listeners: [
                  {
                    id: 'l-div-c',
                    type: 'click',
                    useCapture: true,
                    handler: 'divCapture',
                    handlerBody: 'console.log("div capture")',
                  },
                  {
                    id: 'l-div-b',
                    type: 'click',
                    useCapture: false,
                    handler: 'divBubble',
                    handlerBody: 'console.log("div bubble")',
                  },
                ],
                children: [
                  {
                    id: 'button',
                    tag: 'button',
                    label: 'button.btn',
                    listeners: [
                      {
                        id: 'l-btn-c',
                        type: 'click',
                        useCapture: true,
                        handler: 'btnCapture',
                        handlerBody: 'console.log("button capture")',
                      },
                      {
                        id: 'l-btn-b',
                        type: 'click',
                        useCapture: false,
                        handler: 'btnBubble',
                        handlerBody: 'console.log("button bubble")',
                      },
                    ],
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },

  // 8. Multiple Listeners
  {
    name: 'Multiple Listeners',
    nameKey: 'eventPresets.multipleListeners',
    eventType: 'click',
    targetNodeId: 'button',
    code: `// Multiple Listeners on One Element
// One node can have multiple capture AND bubble listeners
// They fire in registration order
const wrapper = document.querySelector("#wrapper");
const btn = document.querySelector(".btn");

// Div — 2 capture + 2 bubble listeners
wrapper.addEventListener("click", function divCapture1(e) {
  console.log("div capture #1");
}, true);
wrapper.addEventListener("click", function divCapture2(e) {
  console.log("div capture #2");
}, true);
wrapper.addEventListener("click", function divBubble1(e) {
  console.log("div bubble #1");
});
wrapper.addEventListener("click", function divBubble2(e) {
  console.log("div bubble #2");
});

// Button
btn.addEventListener("click", function btnCapture(e) {
  console.log("button capture");
}, true);
btn.addEventListener("click", function btnBubble(e) {
  console.log("button bubble");
});

btn.click();`,
    tree: {
      root: {
        id: 'window',
        tag: 'window',
        label: 'window',
        listeners: [],
        children: [
          {
            id: 'document',
            tag: 'document',
            label: 'document',
            listeners: [],
            children: [
              {
                id: 'div',
                tag: 'div',
                label: 'div#wrapper',
                listeners: [
                  {
                    id: 'l-div-c1',
                    type: 'click',
                    useCapture: true,
                    handler: 'divCapture1',
                    handlerBody: 'console.log("div capture #1")',
                  },
                  {
                    id: 'l-div-c2',
                    type: 'click',
                    useCapture: true,
                    handler: 'divCapture2',
                    handlerBody: 'console.log("div capture #2")',
                  },
                  {
                    id: 'l-div-b1',
                    type: 'click',
                    useCapture: false,
                    handler: 'divBubble1',
                    handlerBody: 'console.log("div bubble #1")',
                  },
                  {
                    id: 'l-div-b2',
                    type: 'click',
                    useCapture: false,
                    handler: 'divBubble2',
                    handlerBody: 'console.log("div bubble #2")',
                  },
                ],
                children: [
                  {
                    id: 'button',
                    tag: 'button',
                    label: 'button.btn',
                    listeners: [
                      {
                        id: 'l-btn-c',
                        type: 'click',
                        useCapture: true,
                        handler: 'btnCapture',
                        handlerBody: 'console.log("button capture")',
                      },
                      {
                        id: 'l-btn-b',
                        type: 'click',
                        useCapture: false,
                        handler: 'btnBubble',
                        handlerBody: 'console.log("button bubble")',
                      },
                    ],
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
];
