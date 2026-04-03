import { h, text, type ReconciliationScenario } from '@/shared/lib/reconciler';

// ── 1. Counter (simple text update) ──

const counterScenario: ReconciliationScenario = {
  name: 'Counter',
  nameKey: 'reconciliationScenarios.counter',
  code: `function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="counter">
      <h1>Counter</h1>
      <span className="value">{count}</span>
      <button onClick={() => setCount(count + 1)}>
        +1
      </button>
    </div>
  );
}`,
  initialState: { count: 0 },
  stateTransitions: [
    { label: 'count: 0 → 1', labelKey: 'reconciliationScenarios.counterInc', stateChanges: { count: 1 } },
    { label: 'count: 1 → 5', labelKey: 'reconciliationScenarios.counterJump', stateChanges: { count: 5 } },
  ],
  renderFn: (state) =>
    h(
      'div',
      { className: 'counter' },
      h('h1', null, text('Counter')),
      h('span', { className: 'value' }, text(`${state.count}`)),
      h('button', { onClick: 'increment' }, text('+1'))
    ),
};

// ── 2. Toggle Visibility ──

const toggleScenario: ReconciliationScenario = {
  name: 'Toggle Visibility',
  nameKey: 'reconciliationScenarios.toggle',
  code: `function Toggle() {
  const [show, setShow] = useState(true);

  return (
    <div className="toggle">
      <button onClick={() => setShow(!show)}>
        Toggle
      </button>
      {show && (
        <p className="content">
          Now you see me!
        </p>
      )}
    </div>
  );
}`,
  initialState: { show: true },
  stateTransitions: [
    { label: 'show: true → false', labelKey: 'reconciliationScenarios.toggleHide', stateChanges: { show: false } },
    { label: 'show: false → true', labelKey: 'reconciliationScenarios.toggleShow', stateChanges: { show: true } },
  ],
  renderFn: (state) => {
    const children = [h('button', { onClick: 'toggle' }, text('Toggle'))];
    if (state.show) {
      children.push(h('p', { className: 'content' }, text('Now you see me!')));
    }
    return h('div', { className: 'toggle' }, ...children);
  },
};

// ── 3. Todo List (with keys) ──

const todoKeyedScenario: ReconciliationScenario = {
  name: 'Todo List (with keys)',
  nameKey: 'reconciliationScenarios.todoKeyed',
  code: `function TodoList() {
  const [todos, setTodos] = useState([
    { id: 'a', text: 'Learn React' },
    { id: 'b', text: 'Build App' },
    { id: 'c', text: 'Deploy' },
  ]);

  return (
    <ul className="todo-list">
      {todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}`,
  initialState: {
    todos: [
      { id: 'a', text: 'Learn React' },
      { id: 'b', text: 'Build App' },
      { id: 'c', text: 'Deploy' },
    ],
  },
  stateTransitions: [
    {
      label: 'Remove "Build App"',
      labelKey: 'reconciliationScenarios.todoRemove',
      stateChanges: {
        todos: [
          { id: 'a', text: 'Learn React' },
          { id: 'c', text: 'Deploy' },
        ],
      },
    },
    {
      label: 'Add "Test" + Reorder',
      labelKey: 'reconciliationScenarios.todoAdd',
      stateChanges: {
        todos: [
          { id: 'c', text: 'Deploy' },
          { id: 'a', text: 'Learn React' },
          { id: 'd', text: 'Test' },
        ],
      },
    },
  ],
  renderFn: (state) =>
    h(
      'ul',
      { className: 'todo-list' },
      ...(state.todos as { id: string; text: string }[]).map((todo) => h('li', { key: todo.id }, text(todo.text)))
    ),
};

// ── 4. Todo List (without keys) ──

const todoUnkeyedScenario: ReconciliationScenario = {
  name: 'Todo List (no keys)',
  nameKey: 'reconciliationScenarios.todoUnkeyed',
  code: `function TodoList() {
  const [todos, setTodos] = useState([
    'Learn React',
    'Build App',
    'Deploy',
  ]);

  // ⚠️ No key prop — React compares by index!
  return (
    <ul className="todo-list">
      {todos.map(todo => (
        <li>{todo}</li>
      ))}
    </ul>
  );
}`,
  initialState: { todos: ['Learn React', 'Build App', 'Deploy'] },
  stateTransitions: [
    {
      label: 'Remove "Build App"',
      labelKey: 'reconciliationScenarios.todoUnkeyedRemove',
      stateChanges: { todos: ['Learn React', 'Deploy'] },
    },
    {
      label: 'Prepend "Plan"',
      labelKey: 'reconciliationScenarios.todoUnkeyedPrepend',
      stateChanges: { todos: ['Plan', 'Learn React', 'Build App', 'Deploy'] },
    },
  ],
  renderFn: (state) =>
    h('ul', { className: 'todo-list' }, ...(state.todos as string[]).map((todo) => h('li', null, text(todo)))),
};

// ── 5. Nested Components ──

const nestedScenario: ReconciliationScenario = {
  name: 'Nested Components',
  nameKey: 'reconciliationScenarios.nested',
  code: `function App() {
  const [mode, setMode] = useState('light');

  return (
    <div className="app">
      <header>
        <h1>My App</h1>
        <button onClick={toggleMode}>
          {mode}
        </button>
      </header>
      {mode === 'light'
        ? <LightTheme />   // <section> wrapper
        : <DarkTheme />    // <article> wrapper — type change!
      }
    </div>
  );
}`,
  initialState: { mode: 'light' },
  stateTransitions: [
    { label: 'light → dark', labelKey: 'reconciliationScenarios.nestedDark', stateChanges: { mode: 'dark' } },
    { label: 'dark → light', labelKey: 'reconciliationScenarios.nestedLight', stateChanges: { mode: 'light' } },
  ],
  renderFn: (state) =>
    h(
      'div',
      { className: 'app' },
      h('header', null, h('h1', null, text('My App')), h('button', { onClick: 'toggleMode' }, text(`${state.mode}`))),
      state.mode === 'light'
        ? h(
            'section',
            { className: 'light-theme' },
            h('p', null, text('Light mode content')),
            h('span', null, text('☀️'))
          )
        : h(
            'article',
            { className: 'dark-theme' },
            h('p', null, text('Dark mode content')),
            h('span', null, text('🌙'))
          )
    ),
};

// ── 6. Class Toggle ──

const classToggleScenario: ReconciliationScenario = {
  name: 'Class Toggle',
  nameKey: 'reconciliationScenarios.classToggle',
  code: `function Card() {
  const [active, setActive] = useState(false);

  return (
    <div className={active ? 'card active' : 'card'}>
      <h2 className="title">Card Title</h2>
      <p className={active ? 'desc highlight' : 'desc'}>
        Description text
      </p>
      <button onClick={() => setActive(!active)}>
        {active ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  );
}`,
  initialState: { active: false },
  stateTransitions: [
    {
      label: 'active: false → true',
      labelKey: 'reconciliationScenarios.classActivate',
      stateChanges: { active: true },
    },
    {
      label: 'active: true → false',
      labelKey: 'reconciliationScenarios.classDeactivate',
      stateChanges: { active: false },
    },
  ],
  renderFn: (state) =>
    h(
      'div',
      { className: state.active ? 'card active' : 'card' },
      h('h2', { className: 'title' }, text('Card Title')),
      h('p', { className: state.active ? 'desc highlight' : 'desc' }, text('Description text')),
      h('button', { onClick: 'toggleActive' }, text(state.active ? 'Deactivate' : 'Activate'))
    ),
};

export const RECONCILIATION_SCENARIOS: ReconciliationScenario[] = [
  counterScenario,
  toggleScenario,
  todoKeyedScenario,
  todoUnkeyedScenario,
  nestedScenario,
  classToggleScenario,
];
