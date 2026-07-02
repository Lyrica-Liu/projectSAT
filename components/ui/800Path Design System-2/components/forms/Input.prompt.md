Labeled text field with a soft rounded border and a lilac focus ring.

```jsx
<Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
```

Optional `hint` text below the field. Supports any input `type`. Focus shows a 4px lilac glow.
