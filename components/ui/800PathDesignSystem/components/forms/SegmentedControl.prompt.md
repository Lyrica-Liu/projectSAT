Pill toggle group on a sunken track — for sign in / sign up, view switches, 2–3 options.

```jsx
<SegmentedControl options={[{value:"signin",label:"Sign in"},{value:"signup",label:"Sign up"}]} value={mode} onChange={setMode} />
```

Active segment lifts to a white pill with a soft shadow. Options can be plain strings or `{value,label}`.
