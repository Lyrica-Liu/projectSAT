/* @ds-bundle: {"format":4,"namespace":"DesignSystem_4010b3","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"Avatar","sourcePath":"components/data-display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/data-display/Badge.jsx"},{"name":"Card","sourcePath":"components/data-display/Card.jsx"},{"name":"ProgressBar","sourcePath":"components/feedback/ProgressBar.jsx"},{"name":"ScoreRing","sourcePath":"components/feedback/ScoreRing.jsx"},{"name":"SkillBar","sourcePath":"components/feedback/SkillBar.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"SegmentedControl","sourcePath":"components/forms/SegmentedControl.jsx"},{"name":"AnswerOption","sourcePath":"components/practice/AnswerOption.jsx"},{"name":"ChoiceCard","sourcePath":"components/practice/ChoiceCard.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"642d9b61d2ae","components/buttons/IconButton.jsx":"c3e6b3325df2","components/data-display/Avatar.jsx":"b4d8bc1b1a46","components/data-display/Badge.jsx":"f5d25bc7835f","components/data-display/Card.jsx":"409cd2d087f0","components/feedback/ProgressBar.jsx":"344f7090be3c","components/feedback/ScoreRing.jsx":"98f29cdb9626","components/feedback/SkillBar.jsx":"6d94aff83f2b","components/forms/Input.jsx":"8193acdb2bfb","components/forms/SegmentedControl.jsx":"3d44d03bc32b","components/practice/AnswerOption.jsx":"c195c565f37b","components/practice/ChoiceCard.jsx":"5e77ad4f6924"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DesignSystem_4010b3 = window.DesignSystem_4010b3 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * 800Path Button — charcoal ink fill, crisp small radius, no shadow.
 * primary: solid charcoal. secondary: hairline outline on bone.
 * ghost: text only. soft: sunken bone fill.
 */
function Button({
  children,
  variant = "primary",
  size = "md",
  full = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  onClick,
  type = "button",
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      padding: "9px 16px",
      fontSize: "13px",
      gap: "7px"
    },
    md: {
      padding: "12px 22px",
      fontSize: "14px",
      gap: "8px"
    },
    lg: {
      padding: "15px 30px",
      fontSize: "14px",
      gap: "9px"
    }
  };
  const variants = {
    primary: {
      background: "var(--brand)",
      color: "var(--text-on-brand)",
      border: "1px solid var(--brand)"
    },
    secondary: {
      background: "transparent",
      color: "var(--text-strong)",
      border: "1px solid var(--border-strong)"
    },
    ghost: {
      background: "transparent",
      color: "var(--text-muted)",
      border: "1px solid transparent"
    },
    soft: {
      background: "var(--surface-sunken)",
      color: "var(--text-strong)",
      border: "1px solid transparent"
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    onClick: onClick,
    disabled: disabled,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: sizes[size].gap,
      padding: sizes[size].padding,
      width: full ? "100%" : "auto",
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--weight-medium)",
      fontSize: sizes[size].fontSize,
      lineHeight: 1,
      letterSpacing: "0.01em",
      borderRadius: "var(--radius-lg)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      boxShadow: "none",
      transition: "background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)",
      ...variants[variant],
      ...style
    },
    onMouseEnter: e => {
      if (disabled) return;
      if (variant === "primary") e.currentTarget.style.background = "var(--brand-hover)";
      if (variant === "secondary") e.currentTarget.style.borderColor = "var(--text-strong)";
      if (variant === "ghost") e.currentTarget.style.color = "var(--text-strong)";
    },
    onMouseLeave: e => {
      if (variant === "primary") e.currentTarget.style.background = "var(--brand)";
      if (variant === "secondary") e.currentTarget.style.borderColor = "var(--border-strong)";
      if (variant === "ghost") e.currentTarget.style.color = "var(--text-muted)";
    }
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * IconButton — square, rounded, icon-only control. Pass a Lucide icon
 * (or any node) as children. Used for nav, close, toolbar actions.
 */
function IconButton({
  children,
  variant = "ghost",
  size = "md",
  label,
  disabled = false,
  onClick,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: 32,
    md: 38,
    lg: 44
  };
  const dim = sizes[size];
  const variants = {
    ghost: {
      background: "transparent",
      color: "var(--text-muted)",
      border: "1px solid transparent"
    },
    surface: {
      background: "var(--surface-card)",
      color: "var(--text-strong)",
      border: "1px solid var(--border-strong)",
      boxShadow: "var(--shadow-xs)"
    },
    soft: {
      background: "var(--brand-soft)",
      color: "var(--brand-ink)",
      border: "1px solid transparent"
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    onClick: onClick,
    disabled: disabled,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: dim,
      height: dim,
      borderRadius: "var(--radius-md)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition: "background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out)",
      ...variants[variant],
      ...style
    },
    onMouseEnter: e => {
      if (variant === "ghost" && !disabled) e.currentTarget.style.background = "var(--surface-sunken)";
    },
    onMouseLeave: e => {
      if (variant === "ghost") e.currentTarget.style.background = "transparent";
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Avatar.jsx
try { (() => {
/**
 * Avatar — a monogram in a hairline square. No pastel fills, no circles:
 * it reads as a stamped initial rather than a chat bubble.
 */
function Avatar({
  name = "",
  initials: initialsProp,
  size = 34,
  tone,
  style = {}
}) {
  const dim = Number(size) || 34;
  const initials = (initialsProp ? String(initialsProp) : name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("")) || "?";
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: dim,
      height: dim,
      flexShrink: 0,
      borderRadius: "var(--radius-sm)",
      border: "1px solid var(--border-strong)",
      background: "transparent",
      color: "var(--text-strong)",
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--weight-medium)",
      fontSize: dim * 0.36,
      letterSpacing: "0.04em",
      ...style
    }
  }, initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Badge.jsx
try { (() => {
/**
 * Badge — a quiet label, not a candy pill: hairline rule, small tracked
 * sans, tone carried by the ink rather than a pastel fill.
 */
function Badge({
  children,
  tone = "lilac",
  size = "md",
  dot = false,
  style = {}
}) {
  const tones = {
    lilac: {
      color: "var(--text-strong)",
      borderColor: "var(--border-strong)"
    },
    neutral: {
      color: "var(--text-muted)",
      borderColor: "var(--border)"
    },
    mint: {
      color: "var(--moss-500)",
      borderColor: "var(--moss-100)"
    },
    success: {
      color: "var(--success)",
      borderColor: "var(--moss-100)"
    },
    sky: {
      color: "var(--slate-500)",
      borderColor: "var(--border)"
    },
    butter: {
      color: "var(--ochre-500)",
      borderColor: "var(--ochre-100)"
    },
    warning: {
      color: "var(--warning)",
      borderColor: "var(--ochre-100)"
    },
    rose: {
      color: "var(--claret-500)",
      borderColor: "var(--claret-100)"
    },
    peach: {
      color: "var(--claret-500)",
      borderColor: "var(--claret-100)"
    },
    danger: {
      color: "var(--danger)",
      borderColor: "var(--claret-100)"
    }
  };
  const sizes = {
    sm: {
      padding: "2px 7px",
      fontSize: "10px"
    },
    md: {
      padding: "3px 9px",
      fontSize: "11px"
    }
  };
  const t = tones[tone] || tones.lilac;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--weight-medium)",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      border: `1px solid ${t.borderColor}`,
      borderRadius: "var(--radius-sm)",
      background: "transparent",
      color: t.color,
      whiteSpace: "nowrap",
      lineHeight: 1.5,
      ...sizes[size],
      ...style
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 4,
      height: 4,
      borderRadius: "50%",
      background: "currentColor",
      display: "inline-block"
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card — a bone surface with a hairline rule. No shadow by default;
 * separation comes from the rule and the space around it.
 */
function Card({
  children,
  tone = "surface",
  padding = "lg",
  radius = "lg",
  shadow = "none",
  interactive = false,
  style = {},
  ...rest
}) {
  const pads = {
    none: 0,
    sm: "var(--space-4)",
    md: "var(--space-5)",
    lg: "var(--space-8)",
    xl: "var(--space-10)"
  };
  const radii = {
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
    "2xl": "var(--radius-2xl)"
  };
  const shadows = {
    none: "none",
    xs: "none",
    sm: "none",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)"
  };
  const tones = {
    surface: {
      background: "var(--surface-card)",
      border: "1px solid var(--border)",
      color: "var(--text-body)"
    },
    sunken: {
      background: "var(--surface-sunken)",
      border: "1px solid transparent",
      color: "var(--text-body)"
    },
    brand: {
      background: "var(--dark-900)",
      border: "1px solid transparent",
      color: "var(--text-on-dark)"
    },
    lilac: {
      background: "var(--surface-sunken)",
      border: "1px solid var(--border)",
      color: "var(--text-strong)"
    },
    mint: {
      background: "var(--moss-50)",
      border: "1px solid transparent",
      color: "var(--moss-600)"
    },
    sky: {
      background: "var(--slate-50)",
      border: "1px solid transparent",
      color: "var(--slate-500)"
    },
    rose: {
      background: "var(--claret-50)",
      border: "1px solid transparent",
      color: "var(--claret-600)"
    }
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      padding: pads[padding],
      borderRadius: radii[radius],
      boxShadow: shadows[shadow],
      transition: interactive ? "border-color var(--dur-base) var(--ease-out)" : "none",
      cursor: interactive ? "pointer" : "default",
      ...tones[tone],
      ...style
    },
    onMouseEnter: interactive ? e => {
      e.currentTarget.style.borderColor = "var(--border-strong)";
    } : undefined,
    onMouseLeave: interactive ? e => {
      e.currentTarget.style.borderColor = tones[tone].border.includes("transparent") ? "transparent" : "var(--border)";
    } : undefined
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Card.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ProgressBar.jsx
try { (() => {
/**
 * ProgressBar — a 2px rule that fills. Square ends, charcoal ink.
 */
function ProgressBar({
  value = 0,
  tone = "brand",
  height = 2,
  showLabel = false,
  style = {}
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const fills = {
    brand: "var(--brand)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      width: "100%",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height,
      background: "var(--surface-sunken)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${clamped}%`,
      height: "100%",
      background: fills[tone],
      transition: "width var(--dur-slow) var(--ease-out)"
    }
  })), showLabel && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "12px",
      fontVariantNumeric: "tabular-nums",
      color: "var(--text-muted)",
      minWidth: 32,
      textAlign: "right"
    }
  }, clamped, "%"));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ScoreRing.jsx
try { (() => {
/**
 * ScoreRing — a fine dial: 3px track, charcoal ink, the figure set large
 * in the display serif. Colour only when the score needs attention.
 */
function ScoreRing({
  score = 0,
  size = 148,
  stroke = 3,
  caption,
  style = {}
}) {
  const pct = Math.max(0, Math.min(100, score));
  const tone = pct >= 58 ? "var(--brand)" : "var(--danger)";
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - pct / 100 * c;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "14px",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: size,
      height: size
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      transform: "rotate(-90deg)"
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "var(--border)",
    strokeWidth: stroke
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: tone,
    strokeWidth: stroke,
    strokeDasharray: c,
    strokeDashoffset: offset,
    style: {
      transition: "stroke-dashoffset var(--dur-slow) var(--ease-out)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-serif)",
      fontWeight: 400,
      fontSize: size * 0.3,
      color: "var(--text-strong)",
      letterSpacing: "-0.02em",
      lineHeight: 1
    }
  }, pct, "%"))), caption && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "12px",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "var(--text-faint)"
    }
  }, caption));
}
Object.assign(__ds_scope, { ScoreRing });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ScoreRing.jsx", error: String((e && e.message) || e) }); }

// components/feedback/SkillBar.jsx
try { (() => {
/**
 * SkillBar — a ruled accuracy row: skill in the reading serif, figure in
 * tabular sans, and a 2px rule beneath. Ink stays charcoal unless the
 * skill needs attention, which is the only time colour appears.
 */
function SkillBar({
  label,
  accuracy = 0,
  detail,
  style = {}
}) {
  const pct = Math.max(0, Math.min(100, accuracy));
  const tone = pct >= 58 ? "var(--brand)" : "var(--danger)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: "14px",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: "10px",
      gap: "16px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-serif)",
      fontSize: "16px",
      color: "var(--text-strong)"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "13px",
      fontVariantNumeric: "tabular-nums",
      color: pct >= 58 ? "var(--text-muted)" : "var(--danger)",
      whiteSpace: "nowrap"
    }
  }, detail ? detail : `${pct}%`)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 2,
      background: "var(--surface-sunken)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${pct}%`,
      height: "100%",
      background: tone,
      transition: "width var(--dur-slow) var(--ease-out)"
    }
  })));
}
Object.assign(__ds_scope, { SkillBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/SkillBar.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input — a ruled field on bone. Label in tracked micro-sans, value in
 * the reading serif, charcoal underline on focus.
 */
function Input({
  label,
  hint,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  id,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "9px",
      width: "100%"
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "11px",
      fontWeight: "var(--weight-medium)",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "var(--text-faint)"
    }
  }, label), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    required: required,
    disabled: disabled,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      width: "100%",
      fontFamily: "var(--font-serif)",
      fontSize: "17px",
      color: "var(--text-strong)",
      background: "transparent",
      border: "0",
      borderBottom: `1px solid ${focused ? "var(--text-strong)" : "var(--border-strong)"}`,
      borderRadius: "0",
      padding: "10px 2px",
      outline: "none",
      transition: "border-color var(--dur-base) var(--ease-out)",
      ...style
    }
  }, rest)), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "12px",
      color: "var(--text-faint)"
    }
  }, hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
/**
 * SegmentedControl — a hairline-ruled group of options. The active one is
 * filled charcoal; no pills, no track shadow.
 */
function SegmentedControl({
  options,
  value,
  onChange,
  size = "md",
  style = {}
}) {
  const pad = size === "sm" ? "8px 14px" : "10px 18px";
  const fontSize = size === "sm" ? "12px" : "13px";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      border: "1px solid var(--border-strong)",
      borderRadius: "var(--radius-md)",
      overflow: "hidden",
      ...style
    }
  }, options.map((opt, i) => {
    const val = typeof opt === "string" ? opt : opt.value;
    const label = typeof opt === "string" ? opt : opt.label;
    const active = val === value;
    return /*#__PURE__*/React.createElement("button", {
      key: val,
      type: "button",
      onClick: () => onChange && onChange(val),
      style: {
        padding: pad,
        fontFamily: "var(--font-sans)",
        fontSize,
        fontWeight: "var(--weight-medium)",
        letterSpacing: "0.01em",
        color: active ? "var(--text-on-brand)" : "var(--text-muted)",
        background: active ? "var(--brand)" : "transparent",
        border: "0",
        borderLeft: i === 0 ? "0" : "1px solid var(--border-strong)",
        cursor: "pointer",
        transition: "background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out)"
      }
    }, label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/practice/AnswerOption.jsx
try { (() => {
/**
 * AnswerOption — a ruled answer row, not a card. The letter sits in the
 * margin in small sans; the answer itself is set in the reading serif.
 * Graded states are carried by a 2px left edge and the ink colour.
 */
function AnswerOption({
  letter,
  children,
  state = "default",
  onClick,
  disabled = false,
  style = {}
}) {
  const states = {
    default: {
      edge: "transparent",
      bg: "transparent",
      text: "var(--text-body)",
      mark: "var(--text-faint)"
    },
    selected: {
      edge: "var(--text-strong)",
      bg: "var(--surface-sunken)",
      text: "var(--text-strong)",
      mark: "var(--text-strong)"
    },
    correct: {
      edge: "var(--success)",
      bg: "var(--success-surface)",
      text: "var(--text-strong)",
      mark: "var(--success)"
    },
    incorrect: {
      edge: "var(--danger)",
      bg: "transparent",
      text: "var(--text-muted)",
      mark: "var(--danger)"
    },
    muted: {
      edge: "transparent",
      bg: "transparent",
      text: "var(--ink-400)",
      mark: "var(--ink-300)"
    }
  };
  const s = states[state] || states.default;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    disabled: disabled,
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: "18px",
      width: "100%",
      textAlign: "left",
      padding: "16px 18px 16px 16px",
      background: s.bg,
      border: "0",
      borderTop: "1px solid var(--border)",
      borderLeft: `2px solid ${s.edge}`,
      borderRadius: "0",
      cursor: disabled ? "default" : "pointer",
      transition: "background var(--dur-fast) var(--ease-out)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 11,
      paddingTop: 4,
      color: s.mark,
      fontFamily: "var(--font-sans)",
      fontSize: "12px",
      letterSpacing: "0.04em"
    }
  }, letter), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-serif)",
      fontSize: "17px",
      lineHeight: 1.5,
      color: s.text
    }
  }, children));
}
Object.assign(__ds_scope, { AnswerOption });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/practice/AnswerOption.jsx", error: String((e && e.message) || e) }); }

// components/practice/ChoiceCard.jsx
try { (() => {
/**
 * ChoiceCard — a ruled selectable row. Selection is a 2px charcoal edge
 * and a faint fill; the marker is a small square, not a radio dot.
 */
function ChoiceCard({
  label,
  desc,
  selected = false,
  onClick,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "20px",
      width: "100%",
      textAlign: "left",
      padding: "18px 20px",
      background: selected ? "var(--surface-sunken)" : "transparent",
      border: "1px solid var(--border)",
      borderLeft: `2px solid ${selected ? "var(--text-strong)" : "var(--border)"}`,
      borderRadius: "var(--radius-md)",
      boxShadow: "none",
      cursor: "pointer",
      transition: "background var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-serif)",
      fontSize: "17px",
      color: "var(--text-strong)"
    }
  }, label), desc && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "12px",
      color: "var(--text-faint)"
    }
  }, desc)), /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 14,
      height: 14,
      borderRadius: "1px",
      border: `1px solid ${selected ? "var(--text-strong)" : "var(--border-strong)"}`,
      background: selected ? "var(--text-strong)" : "transparent",
      transition: "all var(--dur-base) var(--ease-out)"
    }
  }));
}
Object.assign(__ds_scope, { ChoiceCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/practice/ChoiceCard.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.ScoreRing = __ds_scope.ScoreRing;

__ds_ns.SkillBar = __ds_scope.SkillBar;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.AnswerOption = __ds_scope.AnswerOption;

__ds_ns.ChoiceCard = __ds_scope.ChoiceCard;

})();
