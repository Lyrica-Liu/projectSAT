/* @ds-bundle: {"format":3,"namespace":"DesignSystem_4010b3","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"Avatar","sourcePath":"components/data-display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/data-display/Badge.jsx"},{"name":"Card","sourcePath":"components/data-display/Card.jsx"},{"name":"ProgressBar","sourcePath":"components/feedback/ProgressBar.jsx"},{"name":"ScoreRing","sourcePath":"components/feedback/ScoreRing.jsx"},{"name":"SkillBar","sourcePath":"components/feedback/SkillBar.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"SegmentedControl","sourcePath":"components/forms/SegmentedControl.jsx"},{"name":"AnswerOption","sourcePath":"components/practice/AnswerOption.jsx"},{"name":"ChoiceCard","sourcePath":"components/practice/ChoiceCard.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"c2817a5f4e47","components/buttons/IconButton.jsx":"c3e6b3325df2","components/data-display/Avatar.jsx":"301aa9b391dc","components/data-display/Badge.jsx":"96b45986f8cb","components/data-display/Card.jsx":"b0cf54cf7c09","components/feedback/ProgressBar.jsx":"0a2035b99ab9","components/feedback/ScoreRing.jsx":"3e21b2933761","components/feedback/SkillBar.jsx":"435202320273","components/forms/Input.jsx":"976b7043396d","components/forms/SegmentedControl.jsx":"5f9bba4643dd","components/practice/AnswerOption.jsx":"3cffb83500b3","components/practice/ChoiceCard.jsx":"fe1766e2edcd","ui_kits/800path/Auth.jsx":"a5e606fc197b","ui_kits/800path/Dashboard.jsx":"4178544ef4c7","ui_kits/800path/History.jsx":"8469251281b4","ui_kits/800path/Landing.jsx":"db6163fc29d0","ui_kits/800path/Results.jsx":"50c62c01380e","ui_kits/800path/Session.jsx":"12a4bf2189d9","ui_kits/800path/Setup.jsx":"5c3f8405f700","ui_kits/800path/Shell.jsx":"df831feea707","ui_kits/800path/data.js":"d7cc763bb223"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DesignSystem_4010b3 = window.DesignSystem_4010b3 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * 800Path Button — pill-rounded, soft. Primary uses the lilac brand;
 * secondary is a quiet outlined surface; ghost is text-only.
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
      padding: "8px 14px",
      fontSize: "var(--text-sm)",
      gap: "6px"
    },
    md: {
      padding: "11px 20px",
      fontSize: "var(--text-sm)",
      gap: "8px"
    },
    lg: {
      padding: "14px 26px",
      fontSize: "var(--text-base)",
      gap: "8px"
    }
  };
  const variants = {
    primary: {
      background: "var(--brand)",
      color: "var(--text-on-brand)",
      border: "1px solid transparent",
      boxShadow: "var(--shadow-brand)"
    },
    secondary: {
      background: "var(--surface-card)",
      color: "var(--text-strong)",
      border: "1px solid var(--border-strong)",
      boxShadow: "var(--shadow-xs)"
    },
    ghost: {
      background: "transparent",
      color: "var(--text-muted)",
      border: "1px solid transparent",
      boxShadow: "none"
    },
    soft: {
      background: "var(--brand-soft)",
      color: "var(--brand-ink)",
      border: "1px solid transparent",
      boxShadow: "none"
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
      fontWeight: "var(--weight-semibold)",
      fontSize: sizes[size].fontSize,
      lineHeight: 1,
      letterSpacing: "var(--tracking-snug)",
      borderRadius: "var(--radius-pill)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition: "transform var(--dur-fast) var(--ease-out), background var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
      ...variants[variant],
      ...style
    },
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = "scale(0.97)";
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = "scale(1)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = "scale(1)";
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
 * Avatar — rounded initials chip in a deterministic pastel tone.
 */
function Avatar({
  name = "",
  initials: initialsProp,
  size = 36,
  tone,
  style = {}
}) {
  const palette = [["var(--lilac-100)", "var(--brand-ink)"], ["var(--mint-surface)", "var(--mint-ink)"], ["var(--sky-surface)", "var(--sky-ink)"], ["var(--rose-surface)", "var(--rose-ink)"], ["var(--peach-surface)", "var(--peach-ink)"]];
  const dim = Number(size) || 36;
  const initials = (initialsProp ? String(initialsProp) : name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("")) || "?";
  const key = name || initialsProp || "";
  const idx = tone != null ? Number(tone) : [...String(key)].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  const [bg, fg] = palette[idx % palette.length];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: dim,
      height: dim,
      flexShrink: 0,
      borderRadius: "50%",
      background: bg,
      color: fg,
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--weight-bold)",
      fontSize: dim * 0.4,
      letterSpacing: "0.01em",
      ...style
    }
  }, initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Badge.jsx
try { (() => {
/**
 * Badge — small pill label in a pastel tone. Used for domains, skills,
 * difficulty and status.
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
      background: "var(--lilac-100)",
      color: "var(--brand-ink)"
    },
    mint: {
      background: "var(--mint-surface)",
      color: "var(--mint-ink)"
    },
    sky: {
      background: "var(--sky-surface)",
      color: "var(--sky-ink)"
    },
    rose: {
      background: "var(--rose-surface)",
      color: "var(--rose-ink)"
    },
    butter: {
      background: "var(--butter-surface)",
      color: "var(--butter-ink)"
    },
    peach: {
      background: "var(--peach-surface)",
      color: "var(--peach-ink)"
    },
    neutral: {
      background: "var(--surface-sunken)",
      color: "var(--text-muted)"
    },
    success: {
      background: "var(--success-surface)",
      color: "var(--success)"
    },
    warning: {
      background: "var(--warning-surface)",
      color: "var(--warning)"
    },
    danger: {
      background: "var(--danger-surface)",
      color: "var(--danger)"
    }
  };
  const sizes = {
    sm: {
      padding: "3px 9px",
      fontSize: "11px"
    },
    md: {
      padding: "4px 11px",
      fontSize: "var(--text-xs)"
    }
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--weight-semibold)",
      borderRadius: "var(--radius-pill)",
      whiteSpace: "nowrap",
      ...sizes[size],
      ...tones[tone],
      ...style
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
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
 * Card — the core surface. Soft white, rounded, hairline border with an
 * optional low shadow. `tone` swaps the fill to a pastel accent; `brand`
 * makes a filled lilac hero card.
 */
function Card({
  children,
  tone = "surface",
  padding = "lg",
  radius = "lg",
  shadow = "sm",
  interactive = false,
  style = {},
  ...rest
}) {
  const pads = {
    none: 0,
    sm: "var(--space-4)",
    md: "var(--space-5)",
    lg: "var(--space-6)",
    xl: "var(--space-8)"
  };
  const radii = {
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
    "2xl": "var(--radius-2xl)"
  };
  const shadows = {
    none: "none",
    xs: "var(--shadow-xs)",
    sm: "var(--shadow-sm)",
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
      background: "var(--brand)",
      border: "1px solid transparent",
      color: "var(--text-on-brand)"
    },
    lilac: {
      background: "var(--lilac-50)",
      border: "1px solid var(--lilac-100)",
      color: "var(--brand-ink)"
    },
    mint: {
      background: "var(--mint-surface)",
      border: "1px solid transparent",
      color: "var(--mint-ink)"
    },
    sky: {
      background: "var(--sky-surface)",
      border: "1px solid transparent",
      color: "var(--sky-ink)"
    },
    rose: {
      background: "var(--rose-surface)",
      border: "1px solid transparent",
      color: "var(--rose-ink)"
    }
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      padding: pads[padding],
      borderRadius: radii[radius],
      boxShadow: shadows[shadow],
      transition: interactive ? "transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)" : "none",
      cursor: interactive ? "pointer" : "default",
      ...tones[tone],
      ...style
    },
    onMouseEnter: interactive ? e => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "var(--shadow-md)";
    } : undefined,
    onMouseLeave: interactive ? e => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = shadows[shadow];
    } : undefined
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Card.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ProgressBar.jsx
try { (() => {
/**
 * ProgressBar — slim rounded track. Default lilac fill; pass `tone`
 * for accuracy coloring.
 */
function ProgressBar({
  value = 0,
  tone = "brand",
  height = 8,
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
      gap: "10px",
      width: "100%",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height,
      background: "var(--surface-sunken)",
      borderRadius: "var(--radius-pill)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${clamped}%`,
      height: "100%",
      background: fills[tone],
      borderRadius: "var(--radius-pill)",
      transition: "width var(--dur-slow) var(--ease-out)"
    }
  })), showLabel && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-xs)",
      fontWeight: 600,
      color: "var(--text-body)",
      minWidth: 34,
      textAlign: "right"
    }
  }, clamped, "%"));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ScoreRing.jsx
try { (() => {
/**
 * ScoreRing — circular progress dial with a big percentage in the center.
 * Auto-colors by score. Used on the results hero.
 */
function ScoreRing({
  score = 0,
  size = 132,
  stroke = 12,
  caption,
  style = {}
}) {
  const pct = Math.max(0, Math.min(100, score));
  const tone = pct >= 80 ? "var(--success)" : pct >= 60 ? "var(--warning)" : "var(--danger)";
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - pct / 100 * c;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
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
    stroke: "var(--surface-sunken)",
    strokeWidth: stroke
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: tone,
    strokeWidth: stroke,
    strokeLinecap: "round",
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
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--weight-extra)",
      fontSize: size * 0.26,
      color: "var(--text-strong)",
      letterSpacing: "var(--tracking-tight)",
      lineHeight: 1
    }
  }, pct, "%"))), caption && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "var(--text-muted)"
    }
  }, caption));
}
Object.assign(__ds_scope, { ScoreRing });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ScoreRing.jsx", error: String((e && e.message) || e) }); }

// components/feedback/SkillBar.jsx
try { (() => {
/**
 * SkillBar — a labeled accuracy row: skill name, percent, and a colored
 * bar that maps accuracy to mint/butter/rose. Core of the dashboard.
 */
function SkillBar({
  label,
  accuracy = 0,
  detail,
  style = {}
}) {
  const pct = Math.max(0, Math.min(100, accuracy));
  const tone = pct >= 75 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: "7px",
      gap: "12px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-body)"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-xs)",
      fontWeight: 600,
      color: "var(--text-strong)",
      whiteSpace: "nowrap"
    }
  }, detail ? detail : `${pct}%`)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      background: "var(--surface-sunken)",
      borderRadius: "var(--radius-pill)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${pct}%`,
      height: "100%",
      background: tone,
      borderRadius: "var(--radius-pill)",
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
 * Input — labeled text field with soft rounded border and lilac focus ring.
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
      gap: "7px",
      width: "100%"
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      fontWeight: "var(--weight-semibold)",
      color: "var(--text-body)"
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
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "var(--text-strong)",
      background: disabled ? "var(--surface-sunken)" : "var(--surface-card)",
      border: `1px solid ${focused ? "var(--brand)" : "var(--border-strong)"}`,
      borderRadius: "var(--radius-md)",
      padding: "11px 14px",
      outline: "none",
      boxShadow: focused ? "0 0 0 4px var(--focus-ring)" : "none",
      transition: "border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
      ...style
    }
  }, rest)), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-xs)",
      color: "var(--text-faint)"
    }
  }, hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
/**
 * SegmentedControl — pill toggle group on a sunken track. Used for
 * sign in / sign up and other 2–3 option switches.
 */
function SegmentedControl({
  options,
  value,
  onChange,
  size = "md",
  style = {}
}) {
  const pad = size === "sm" ? "6px 12px" : "8px 16px";
  const fontSize = size === "sm" ? "var(--text-xs)" : "var(--text-sm)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      padding: "4px",
      gap: "4px",
      background: "var(--surface-sunken)",
      borderRadius: "var(--radius-pill)",
      ...style
    }
  }, options.map(opt => {
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
        fontWeight: "var(--weight-semibold)",
        color: active ? "var(--text-strong)" : "var(--text-muted)",
        background: active ? "var(--surface-card)" : "transparent",
        border: "none",
        borderRadius: "var(--radius-pill)",
        boxShadow: active ? "var(--shadow-sm)" : "none",
        cursor: "pointer",
        transition: "all var(--dur-base) var(--ease-out)"
      }
    }, label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/practice/AnswerOption.jsx
try { (() => {
/**
 * AnswerOption — a multiple-choice answer row (A–D) with letter chip and
 * graded states: default, selected, correct, incorrect, muted.
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
      bg: "var(--surface-card)",
      border: "var(--border-strong)",
      text: "var(--text-body)",
      chipBg: "var(--surface-sunken)",
      chipText: "var(--text-muted)"
    },
    selected: {
      bg: "var(--lilac-50)",
      border: "var(--lilac-300)",
      text: "var(--brand-ink)",
      chipBg: "var(--lilac-400)",
      chipText: "#fff"
    },
    correct: {
      bg: "var(--mint-surface)",
      border: "#a9ddc7",
      text: "var(--mint-ink)",
      chipBg: "#69bf9e",
      chipText: "#fff"
    },
    incorrect: {
      bg: "var(--rose-surface)",
      border: "#f1bccd",
      text: "#a8456b",
      chipBg: "#d77a99",
      chipText: "#fff"
    },
    muted: {
      bg: "var(--surface-card)",
      border: "var(--border)",
      text: "var(--text-faint)",
      chipBg: "var(--surface-sunken)",
      chipText: "var(--text-faint)"
    }
  };
  const s = states[state];
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    disabled: disabled,
    style: {
      display: "flex",
      alignItems: "center",
      gap: "13px",
      width: "100%",
      textAlign: "left",
      padding: "13px 15px",
      background: s.bg,
      border: `1.5px solid ${s.border}`,
      borderRadius: "var(--radius-md)",
      cursor: disabled ? "default" : "pointer",
      transition: "all var(--dur-base) var(--ease-out)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 26,
      height: 26,
      borderRadius: "10px",
      background: s.chipBg,
      color: s.chipText,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-mono)",
      fontWeight: 600,
      fontSize: "var(--text-xs)"
    }
  }, letter), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      lineHeight: "var(--leading-snug)",
      color: s.text
    }
  }, children));
}
Object.assign(__ds_scope, { AnswerOption });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/practice/AnswerOption.jsx", error: String((e && e.message) || e) }); }

// components/practice/ChoiceCard.jsx
try { (() => {
/**
 * ChoiceCard — a large selectable option row with a radio indicator.
 * Used in practice setup (domain / session length). Selected state
 * tints lilac.
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
      gap: "16px",
      width: "100%",
      textAlign: "left",
      padding: "15px 18px",
      background: selected ? "var(--lilac-50)" : "var(--surface-card)",
      border: `1.5px solid ${selected ? "var(--lilac-300)" : "var(--border-strong)"}`,
      borderRadius: "var(--radius-md)",
      boxShadow: selected ? "0 0 0 4px var(--focus-ring)" : "var(--shadow-xs)",
      cursor: "pointer",
      transition: "all var(--dur-base) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "2px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-semibold)",
      color: selected ? "var(--brand-ink)" : "var(--text-strong)"
    }
  }, label), desc && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      color: selected ? "var(--lilac-400)" : "var(--text-faint)"
    }
  }, desc)), /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 18,
      height: 18,
      borderRadius: "50%",
      border: `2px solid ${selected ? "var(--lilac-400)" : "var(--border-strong)"}`,
      background: selected ? "var(--lilac-400)" : "transparent",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all var(--dur-base) var(--ease-out)"
    }
  }, selected && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "#fff"
    }
  })));
}
Object.assign(__ds_scope, { ChoiceCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/practice/ChoiceCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/800path/Auth.jsx
try { (() => {
// Auth — sign in / sign up.
function Auth({
  go
}) {
  const {
    Button,
    Input,
    SegmentedControl,
    Card
  } = window.DesignSystem_4010b3;
  const [mode, setMode] = React.useState("signin");
  const [email, setEmail] = React.useState("maya@example.com");
  const [pw, setPw] = React.useState("password123");
  const [name, setName] = React.useState("");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      background: "var(--canvas)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 20px"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go("landing"),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 9,
      background: "none",
      border: "none",
      cursor: "pointer",
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      background: "var(--gradient-radiant)",
      color: "#fff",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-sans)",
      fontWeight: 700,
      fontSize: 18,
      boxShadow: "var(--shadow-brand)"
    }
  }, "8"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 800,
      fontSize: 21,
      letterSpacing: "var(--tracking-tight)",
      color: "var(--text-strong)"
    }
  }, "800Path")), /*#__PURE__*/React.createElement(Card, {
    tone: "surface",
    padding: "xl",
    radius: "xl",
    shadow: "md",
    style: {
      width: "100%",
      maxWidth: 380
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    options: [{
      value: "signin",
      label: "Sign in"
    }, {
      value: "signup",
      label: "Sign up"
    }],
    value: mode,
    onChange: setMode,
    style: {
      width: "100%",
      display: "flex"
    }
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 700,
      fontSize: "var(--text-lg)",
      color: "var(--text-strong)",
      margin: "0 0 4px"
    }
  }, mode === "signin" ? "Welcome back" : "Create your account"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "var(--text-muted)",
      margin: "0 0 22px"
    }
  }, mode === "signin" ? "Sign in to continue your practice." : "Start improving your SAT score today."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, mode === "signup" && /*#__PURE__*/React.createElement(Input, {
    label: "Display name",
    placeholder: "Your name",
    value: name,
    onChange: e => setName(e.target.value)
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Email",
    type: "email",
    value: email,
    onChange: e => setEmail(e.target.value)
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Password",
    type: "password",
    value: pw,
    onChange: e => setPw(e.target.value)
  }), /*#__PURE__*/React.createElement(Button, {
    full: true,
    size: "lg",
    onClick: () => go("dashboard"),
    style: {
      marginTop: 4
    }
  }, mode === "signin" ? "Sign in" : "Create account"))), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 22,
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      color: "var(--text-faint)",
      textAlign: "center",
      maxWidth: 320,
      lineHeight: 1.6
    }
  }, "By continuing, you agree to our ", /*#__PURE__*/React.createElement("span", {
    style: {
      textDecoration: "underline",
      cursor: "pointer"
    }
  }, "Terms"), " and ", /*#__PURE__*/React.createElement("span", {
    style: {
      textDecoration: "underline",
      cursor: "pointer"
    }
  }, "Privacy Policy"), "."));
}
window.Auth = Auth;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/800path/Auth.jsx", error: String((e && e.message) || e) }); }

// ui_kits/800path/Dashboard.jsx
try { (() => {
// Dashboard — greeting, stats, start CTA, skill breakdown, recent sessions.
function Dashboard({
  go
}) {
  const {
    Card,
    Button,
    SkillBar,
    Avatar,
    Badge
  } = window.DesignSystem_4010b3;
  const d = window.PW_DATA;
  const avg = Math.round(d.recent.reduce((a, s) => a + s.score, 0) / d.recent.length);
  const weakest = [...d.skills].sort((a, b) => a.accuracy - b.accuracy)[0];
  const stats = [{
    label: "Sessions done",
    value: d.recent.length
  }, {
    label: "Avg. score",
    value: avg + "%"
  }, {
    label: "Skills tracked",
    value: d.skills.length
  }, {
    label: "Weakest skill",
    value: weakest.label,
    small: true
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      background: "var(--canvas)"
    }
  }, /*#__PURE__*/React.createElement(TopNav, {
    go: go,
    right: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(NavLink, {
      onClick: () => go("history")
    }, "History"), /*#__PURE__*/React.createElement(NavLink, {
      onClick: () => go("landing")
    }, "Sign out"), /*#__PURE__*/React.createElement(Avatar, {
      name: d.user.name,
      size: 34
    }))
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      maxWidth: 1040,
      margin: "0 auto",
      padding: "40px 24px 64px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 30
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 800,
      fontSize: "var(--text-xl)",
      color: "var(--text-strong)",
      margin: 0,
      letterSpacing: "var(--tracking-snug)"
    }
  }, "Hey, ", d.user.name.split(" ")[0], " \uD83D\uDC4B"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "var(--text-muted)",
      margin: "6px 0 0"
    }
  }, "Ready for a session? Let's keep the streak going.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 16,
      marginBottom: 24
    }
  }, stats.map(s => /*#__PURE__*/React.createElement(Card, {
    key: s.label,
    tone: "surface",
    padding: "md",
    radius: "lg"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      fontWeight: 600,
      color: "var(--text-muted)",
      margin: "0 0 8px"
    }
  }, s.label), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 800,
      fontSize: s.small ? "var(--text-base)" : "var(--text-xl)",
      color: "var(--text-strong)",
      margin: 0,
      lineHeight: 1.1,
      letterSpacing: "var(--tracking-snug)"
    }
  }, s.value)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 2fr",
      gap: 22,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tone: "brand",
    padding: "lg",
    radius: "xl",
    shadow: "md",
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 800,
      fontSize: "var(--text-lg)",
      margin: "0 0 8px"
    }
  }, "Start a session"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "var(--lilac-100)",
      margin: 0,
      lineHeight: "var(--leading-relaxed)"
    }
  }, "10 questions. ~8 minutes. Instant AI feedback.")), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => go("setup"),
    style: {
      marginTop: "auto"
    },
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 17
    })
  }, "Practice now")), /*#__PURE__*/React.createElement(Card, {
    tone: "surface",
    padding: "lg",
    radius: "xl"
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 700,
      fontSize: "var(--text-sm)",
      color: "var(--text-strong)",
      margin: "0 0 18px"
    }
  }, "Skill accuracy"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 15
    }
  }, [...d.skills].sort((a, b) => a.accuracy - b.accuracy).map(s => /*#__PURE__*/React.createElement(SkillBar, {
    key: s.key,
    label: s.label,
    accuracy: s.accuracy,
    detail: `${s.n} · ${s.accuracy}%`
  }))))), /*#__PURE__*/React.createElement(Card, {
    tone: "surface",
    padding: "lg",
    radius: "xl"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 700,
      fontSize: "var(--text-sm)",
      color: "var(--text-strong)",
      margin: 0
    }
  }, "Recent sessions"), /*#__PURE__*/React.createElement(NavLink, {
    onClick: () => go("history")
  }, "View all \u2192")), /*#__PURE__*/React.createElement("div", null, d.recent.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "13px 0",
      borderTop: i ? "1px solid var(--border)" : "none"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 600,
      fontSize: "var(--text-sm)",
      color: "var(--text-strong)",
      margin: 0
    }
  }, s.domain), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      color: "var(--text-faint)",
      margin: "3px 0 0"
    }
  }, s.date, " \xB7 ", s.count, " questions")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: s.score >= 80 ? "mint" : s.score >= 60 ? "butter" : "rose"
  }, s.score, "%"), /*#__PURE__*/React.createElement(NavLink, {
    onClick: () => go("results")
  }, "Review \u2192"))))))));
}
window.Dashboard = Dashboard;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/800path/Dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/800path/History.jsx
try { (() => {
// History — full list of completed sessions.
function History({
  go
}) {
  const {
    Card,
    Button,
    Badge,
    Avatar
  } = window.DesignSystem_4010b3;
  const d = window.PW_DATA;
  const all = [...d.recent, {
    id: "s5",
    domain: "Reading",
    date: "Jun 11, 2026",
    score: 55,
    count: 10
  }, {
    id: "s6",
    domain: "Writing",
    date: "Jun 9, 2026",
    score: 80,
    count: 15
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      background: "var(--canvas)"
    }
  }, /*#__PURE__*/React.createElement(TopNav, {
    go: go,
    maxWidth: 720,
    right: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(NavLink, {
      onClick: () => go("dashboard")
    }, "\u2190 Dashboard"), /*#__PURE__*/React.createElement(Avatar, {
      name: d.user.name,
      size: 34
    }))
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      maxWidth: 720,
      margin: "0 auto",
      padding: "40px 24px 64px"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 800,
      fontSize: "var(--text-xl)",
      color: "var(--text-strong)",
      margin: "0 0 22px",
      letterSpacing: "var(--tracking-snug)"
    }
  }, "Session history"), /*#__PURE__*/React.createElement(Card, {
    tone: "surface",
    padding: "none",
    radius: "xl",
    style: {
      overflow: "hidden"
    }
  }, all.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 22px",
      borderTop: i ? "1px solid var(--border)" : "none"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 600,
      fontSize: "var(--text-sm)",
      color: "var(--text-strong)",
      margin: 0
    }
  }, s.domain), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      color: "var(--text-faint)",
      margin: "3px 0 0"
    }
  }, s.date, " \xB7 ", s.count, " questions")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: s.score >= 80 ? "mint" : s.score >= 60 ? "butter" : "rose"
  }, s.score, "%"), /*#__PURE__*/React.createElement(NavLink, {
    onClick: () => go("results")
  }, "Review \u2192"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    onClick: () => go("setup"),
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 18
    })
  }, "New session"))));
}
window.History = History;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/800path/History.jsx", error: String((e && e.message) || e) }); }

// ui_kits/800path/Landing.jsx
try { (() => {
// Landing / marketing page.
function Landing({
  go
}) {
  const {
    Button,
    Badge,
    Card
  } = window.DesignSystem_4010b3;
  const steps = [{
    n: "01",
    t: "Pick your focus",
    d: "Choose Reading, Writing, or both — and how many questions."
  }, {
    n: "02",
    t: "Answer questions",
    d: "Real SAT-style passages and questions. No fluff, no filler."
  }, {
    n: "03",
    t: "Review & reflect",
    d: "See your score, skill breakdown, and personalized AI feedback."
  }];
  const features = [{
    icon: "zap",
    t: "Focused sessions",
    d: "10-question sprints that fit into any break."
  }, {
    icon: "target",
    t: "Skill targeting",
    d: "Drill exactly the skills where you're weakest."
  }, {
    icon: "sparkles",
    t: "AI feedback",
    d: "Personalized analysis after every session — not generic tips."
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface)",
      minHeight: "100%"
    }
  }, /*#__PURE__*/React.createElement(TopNav, {
    go: go,
    right: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(NavLink, {
      onClick: () => go("auth")
    }, "Sign in"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      onClick: () => go("auth")
    }, "Get started"))
  }), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 760,
      margin: "0 auto",
      padding: "84px 24px 64px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      marginBottom: 26
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "lilac",
    dot: true
  }, "SAT Reading & Writing")), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 800,
      fontSize: "var(--text-4xl)",
      lineHeight: 1.04,
      letterSpacing: "var(--tracking-tight)",
      color: "var(--text-strong)",
      margin: "0 0 22px"
    }
  }, "Study smarter,", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--lilac-500)"
    }
  }, "not harder.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-md)",
      color: "var(--text-muted)",
      lineHeight: "var(--leading-relaxed)",
      maxWidth: 480,
      margin: "0 auto 34px"
    }
  }, "Short, focused practice sessions with AI-powered feedback \u2014 built for self-studiers who want real improvement, not just more questions."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      justifyContent: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    onClick: () => go("auth"),
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 18
    })
  }, "Start practicing \u2014 it's free"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "ghost",
    onClick: () => go("dashboard")
  }, "See the dashboard"))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--canvas)",
      borderTop: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
      padding: "56px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 960,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 22
    }
  }, features.map(f => /*#__PURE__*/React.createElement(Card, {
    key: f.t,
    tone: "surface",
    padding: "lg",
    radius: "xl"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      width: 42,
      height: 42,
      borderRadius: 12,
      background: "var(--lilac-100)",
      color: "var(--lilac-600)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: f.icon,
    size: 20
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 700,
      fontSize: "var(--text-base)",
      color: "var(--text-strong)",
      margin: "0 0 6px"
    }
  }, f.t), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "var(--text-muted)",
      lineHeight: "var(--leading-normal)",
      margin: 0
    }
  }, f.d))))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 820,
      margin: "0 auto",
      padding: "72px 24px"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 700,
      fontSize: "var(--text-xl)",
      textAlign: "center",
      color: "var(--text-strong)",
      margin: "0 0 44px",
      letterSpacing: "var(--tracking-snug)"
    }
  }, "How it works"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 28
    }
  }, steps.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.n
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontWeight: 600,
      fontSize: "var(--text-sm)",
      color: "var(--lilac-400)"
    }
  }, s.n), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 700,
      fontSize: "var(--text-base)",
      color: "var(--text-strong)",
      margin: "10px 0 6px"
    }
  }, s.t), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "var(--text-muted)",
      lineHeight: "var(--leading-relaxed)",
      margin: 0
    }
  }, s.d))))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: "0 24px 80px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720,
      margin: "0 auto",
      background: "var(--lilac-500)",
      borderRadius: "var(--radius-2xl)",
      padding: "52px 32px",
      textAlign: "center",
      boxShadow: "var(--shadow-lg)"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 800,
      fontSize: "var(--text-2xl)",
      color: "#fff",
      margin: "0 0 12px",
      letterSpacing: "var(--tracking-tight)"
    }
  }, "Ready to improve your score?"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "var(--lilac-100)",
      margin: "0 0 28px"
    }
  }, "Free to use. No credit card. First session in under a minute."), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "secondary",
    onClick: () => go("auth")
  }, "Create your account"))), /*#__PURE__*/React.createElement("footer", {
    style: {
      borderTop: "1px solid var(--border)",
      padding: "26px 24px",
      textAlign: "center",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      color: "var(--text-faint)"
    }
  }, "800Path \xA9 2026 \u2014 SAT is a trademark of College Board."));
}
window.Landing = Landing;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/800path/Landing.jsx", error: String((e && e.message) || e) }); }

// ui_kits/800path/Results.jsx
try { (() => {
// Results — score ring, AI feedback, skill breakdown, question review.
function Results({
  go
}) {
  const {
    Card,
    Button,
    ScoreRing,
    SkillBar,
    Badge
  } = window.DesignSystem_4010b3;
  const d = window.PW_DATA;
  const score = 82;
  const review = d.questions.map((q, i) => ({
    n: i + 1,
    skill: q.skill,
    correct: i !== 2,
    your: i !== 2 ? q.answer : "A",
    answer: q.answer,
    stem: q.stem,
    explanation: q.explanation
  }));
  const breakdown = d.skills.slice(0, 4);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      background: "var(--canvas)"
    }
  }, /*#__PURE__*/React.createElement(TopNav, {
    go: go,
    maxWidth: 720,
    right: /*#__PURE__*/React.createElement(NavLink, {
      onClick: () => go("dashboard")
    }, "Dashboard")
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      maxWidth: 720,
      margin: "0 auto",
      padding: "36px 24px 64px"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tone: "surface",
    padding: "xl",
    radius: "xl",
    shadow: "sm",
    style: {
      textAlign: "center",
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "pw-eyebrow",
    style: {
      margin: "0 0 18px"
    }
  }, "Session complete"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(ScoreRing, {
    score: score,
    caption: `${review.filter(r => r.correct).length} of ${review.length} correct · Reading & Writing`
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "left",
      background: "var(--lilac-50)",
      border: "1px solid var(--lilac-100)",
      borderRadius: "var(--radius-lg)",
      padding: "18px 20px",
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      fontFamily: "var(--font-sans)",
      fontWeight: 700,
      fontSize: "var(--text-xs)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "uppercase",
      color: "var(--lilac-600)",
      margin: "0 0 10px"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 14
  }), " AI Feedback"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "var(--brand-ink)",
      lineHeight: "var(--leading-relaxed)",
      margin: 0
    }
  }, "Strong work on Words in Context \u2014 you nailed the contrast clues. Your misses clustered in Command of Evidence, where you tended to pick answers that sounded relevant but weren't directly supported. Next session, try underlining the exact line that proves each answer before choosing."))), /*#__PURE__*/React.createElement(Card, {
    tone: "surface",
    padding: "lg",
    radius: "xl",
    style: {
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 700,
      fontSize: "var(--text-sm)",
      color: "var(--text-strong)",
      margin: "0 0 18px"
    }
  }, "Skill breakdown"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 15
    }
  }, breakdown.map(s => /*#__PURE__*/React.createElement(SkillBar, {
    key: s.key,
    label: s.label,
    accuracy: s.accuracy,
    detail: `${s.n} · ${s.accuracy}%`
  })))), /*#__PURE__*/React.createElement(Card, {
    tone: "surface",
    padding: "lg",
    radius: "xl",
    style: {
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 700,
      fontSize: "var(--text-sm)",
      color: "var(--text-strong)",
      margin: "0 0 16px"
    }
  }, "Question review"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, review.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.n,
    style: {
      borderRadius: "var(--radius-lg)",
      padding: "16px 18px",
      background: r.correct ? "var(--mint-surface)" : "var(--rose-surface)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--text-strong)"
    }
  }, "Q", r.n), " \xB7 ", r.skill), /*#__PURE__*/React.createElement(Badge, {
    tone: r.correct ? "mint" : "rose",
    size: "sm"
  }, r.correct ? "Correct" : "Incorrect")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 600,
      fontSize: "var(--text-sm)",
      color: "var(--text-strong)",
      lineHeight: "var(--leading-snug)",
      margin: "0 0 8px"
    }
  }, r.stem), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      color: "var(--text-body)",
      margin: "0 0 10px"
    }
  }, "Your answer: ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: r.correct ? "var(--mint-ink)" : "var(--rose-ink)"
    }
  }, r.your), !r.correct && /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 Correct: ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--mint-ink)"
    }
  }, r.answer))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(255,255,255,0.7)",
      borderRadius: "var(--radius-md)",
      padding: "11px 13px"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      color: "var(--text-body)",
      lineHeight: "var(--leading-relaxed)",
      margin: 0
    }
  }, r.explanation)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    full: true,
    size: "lg",
    onClick: () => go("setup"),
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 18
    })
  }, "Practice again"), /*#__PURE__*/React.createElement(Button, {
    full: true,
    size: "lg",
    variant: "secondary",
    onClick: () => go("dashboard")
  }, "Dashboard"))));
}
window.Results = Results;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/800path/Results.jsx", error: String((e && e.message) || e) }); }

// ui_kits/800path/Session.jsx
try { (() => {
// Active session — answer questions one at a time with instant reveal.
function Session({
  go
}) {
  const {
    Badge,
    Card,
    AnswerOption,
    ProgressBar,
    Button
  } = window.DesignSystem_4010b3;
  const qs = window.PW_DATA.questions;
  const [idx, setIdx] = React.useState(0);
  const [picks, setPicks] = React.useState(qs.map(() => null)); // chosen letter per question

  const q = qs[idx];
  const picked = picks[idx];
  const revealed = picked !== null;
  const answered = picks.filter(p => p !== null).length;
  const allDone = answered === qs.length;
  function choose(letter) {
    if (revealed) return;
    setPicks(prev => prev.map((p, i) => i === idx ? letter : p));
  }
  function stateFor(letter) {
    if (!revealed) return picked === letter ? "selected" : "default";
    if (letter === q.answer) return "correct";
    if (letter === picked) return "incorrect";
    return "muted";
  }
  const diffTone = {
    Easy: "mint",
    Medium: "butter",
    Hard: "peach",
    Expert: "rose"
  }[q.difficulty];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      background: "var(--canvas)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 10,
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720,
      margin: "0 auto",
      padding: "14px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 700,
      fontSize: "var(--text-sm)",
      color: "var(--text-strong)"
    }
  }, "Q", idx + 1, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-faint)",
      fontWeight: 500
    }
  }, "of ", qs.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-xs)",
      color: "var(--text-faint)"
    }
  }, answered, "/", qs.length, " answered"), allDone && /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => go("results")
  }, "Finish \u2192"))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720,
      margin: "0 auto",
      padding: "0 24px 12px"
    }
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    value: answered / qs.length * 100,
    height: 6
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      padding: "12px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720,
      margin: "0 auto",
      display: "flex",
      gap: 8
    }
  }, qs.map((_, i) => {
    const p = picks[i];
    const isCur = i === idx;
    const correct = p && p === qs[i].answer;
    let bg = "var(--surface-sunken)",
      col = "var(--text-muted)";
    if (isCur) {
      bg = "var(--lilac-500)";
      col = "#fff";
    } else if (p) {
      bg = correct ? "var(--mint-surface)" : "var(--rose-surface)";
      col = correct ? "var(--mint-ink)" : "var(--rose-ink)";
    }
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: () => setIdx(i),
      style: {
        width: 34,
        height: 34,
        borderRadius: 9,
        border: "none",
        cursor: "pointer",
        fontFamily: "var(--font-mono)",
        fontWeight: 600,
        fontSize: "var(--text-xs)",
        background: bg,
        color: col,
        transition: "all var(--dur-base) var(--ease-out)"
      }
    }, i + 1);
  }))), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      maxWidth: 720,
      width: "100%",
      margin: "0 auto",
      padding: "30px 24px 48px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 20,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "sky"
  }, q.domain), /*#__PURE__*/React.createElement(Badge, {
    tone: "lilac"
  }, q.skill), /*#__PURE__*/React.createElement(Badge, {
    tone: diffTone,
    dot: true
  }, q.difficulty)), q.passage && /*#__PURE__*/React.createElement(Card, {
    tone: "sunken",
    padding: "lg",
    radius: "lg",
    shadow: "none",
    style: {
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "pw-eyebrow",
    style: {
      margin: "0 0 10px"
    }
  }, "Passage"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "var(--text-body)",
      lineHeight: "var(--leading-relaxed)",
      margin: 0,
      whiteSpace: "pre-wrap"
    }
  }, q.passage)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 700,
      fontSize: "var(--text-md)",
      color: "var(--text-strong)",
      lineHeight: "var(--leading-snug)",
      margin: "0 0 18px"
    }
  }, q.stem), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      marginBottom: 24
    }
  }, ["A", "B", "C", "D"].map(c => /*#__PURE__*/React.createElement(AnswerOption, {
    key: c,
    letter: c,
    state: stateFor(c),
    disabled: revealed,
    onClick: () => choose(c)
  }, q.options[c]))), revealed && /*#__PURE__*/React.createElement(Card, {
    tone: picked === q.answer ? "mint" : "rose",
    padding: "lg",
    radius: "lg",
    shadow: "none",
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "pw-eyebrow",
    style: {
      margin: "0 0 8px",
      color: "inherit",
      opacity: 0.8
    }
  }, picked === q.answer ? "Nice — correct!" : "Not quite"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      lineHeight: "var(--leading-relaxed)",
      margin: 0,
      color: "inherit"
    }
  }, q.explanation)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    disabled: idx === 0,
    onClick: () => setIdx(i => Math.max(0, i - 1)),
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-left",
      size: 17
    })
  }, "Previous"), idx < qs.length - 1 ? /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => setIdx(i => i + 1),
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 17
    })
  }, "Next") : /*#__PURE__*/React.createElement(Button, {
    onClick: () => go("results"),
    disabled: !allDone,
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 17
    })
  }, "Finish session"))));
}
window.Session = Session;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/800path/Session.jsx", error: String((e && e.message) || e) }); }

// ui_kits/800path/Setup.jsx
try { (() => {
// Practice setup — choose domain + question count.
function Setup({
  go
}) {
  const {
    Button,
    ChoiceCard
  } = window.DesignSystem_4010b3;
  const [domain, setDomain] = React.useState("both");
  const [count, setCount] = React.useState(10);
  const domains = [{
    value: "both",
    label: "Reading & Writing",
    desc: "Mix of both domains"
  }, {
    value: "reading",
    label: "Reading",
    desc: "Passages & comprehension"
  }, {
    value: "writing",
    label: "Writing",
    desc: "Grammar & expression"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      background: "var(--canvas)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement(TopNav, {
    go: go,
    maxWidth: 760,
    right: /*#__PURE__*/React.createElement(NavLink, {
      onClick: () => go("dashboard")
    }, "\u2190 Dashboard")
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "56px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 440
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 800,
      fontSize: "var(--text-xl)",
      color: "var(--text-strong)",
      margin: "0 0 6px",
      letterSpacing: "var(--tracking-snug)"
    }
  }, "Set up your session"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "var(--text-muted)",
      margin: "0 0 30px"
    }
  }, "Pick what you want to practice and how many questions."), /*#__PURE__*/React.createElement("p", {
    className: "pw-eyebrow",
    style: {
      margin: "0 0 12px"
    }
  }, "Domain"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      marginBottom: 30
    }
  }, domains.map(o => /*#__PURE__*/React.createElement(ChoiceCard, {
    key: o.value,
    label: o.label,
    desc: o.desc,
    selected: domain === o.value,
    onClick: () => setDomain(o.value)
  }))), /*#__PURE__*/React.createElement("p", {
    className: "pw-eyebrow",
    style: {
      margin: "0 0 12px"
    }
  }, "Number of questions"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginBottom: 8
    }
  }, [5, 10, 15, 20].map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    onClick: () => setCount(n),
    style: {
      flex: 1,
      padding: "13px 0",
      borderRadius: "var(--radius-md)",
      fontFamily: "var(--font-sans)",
      fontWeight: 700,
      fontSize: "var(--text-sm)",
      cursor: "pointer",
      transition: "all var(--dur-base) var(--ease-out)",
      background: count === n ? "var(--lilac-50)" : "var(--surface)",
      border: `1.5px solid ${count === n ? "var(--lilac-300)" : "var(--border-strong)"}`,
      color: count === n ? "var(--brand-ink)" : "var(--text-body)",
      boxShadow: count === n ? "0 0 0 4px var(--focus-ring)" : "none"
    }
  }, n))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      color: "var(--text-faint)",
      margin: "0 0 30px"
    }
  }, "~", Math.round(count * 0.8), " min estimated"), /*#__PURE__*/React.createElement(Button, {
    full: true,
    size: "lg",
    onClick: () => go("session"),
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 18
    })
  }, "Start session"))));
}
window.Setup = Setup;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/800path/Setup.jsx", error: String((e && e.message) || e) }); }

// ui_kits/800path/Shell.jsx
try { (() => {
// Shared chrome: top navigation bar with wordmark + actions.
function Icon({
  name,
  size = 18,
  color = "currentColor",
  strokeWidth = 2,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("i", {
    "data-lucide": name,
    style: {
      width: size,
      height: size,
      color,
      display: "inline-flex",
      ...style
    },
    "data-stroke": strokeWidth
  });
}
function Wordmark({
  onClick,
  light = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 9,
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 9,
      background: light ? "#fff" : "var(--gradient-radiant)",
      color: light ? "var(--lilac-600)" : "#fff",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-sans)",
      fontWeight: 700,
      fontSize: 16,
      boxShadow: light ? "none" : "var(--shadow-brand)"
    }
  }, "8"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 800,
      fontSize: 18,
      letterSpacing: "var(--tracking-tight)",
      color: light ? "#fff" : "var(--text-strong)"
    }
  }, "800Path"));
}
function TopNav({
  go,
  right,
  maxWidth = 1040
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 10,
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid var(--border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth,
      margin: "0 auto",
      padding: "14px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    onClick: () => go("dashboard")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 18
    }
  }, right)));
}
function NavLink({
  children,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      fontWeight: 500,
      color: "var(--text-muted)",
      padding: "6px 4px"
    },
    onMouseEnter: e => e.currentTarget.style.color = "var(--text-strong)",
    onMouseLeave: e => e.currentTarget.style.color = "var(--text-muted)"
  }, children);
}
Object.assign(window, {
  Icon,
  Wordmark,
  TopNav,
  NavLink
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/800path/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/800path/data.js
try { (() => {
// 800Path UI kit — mock data (no backend). Mirrors the projectSAT schema:
// sessions, questions (domain/skill/difficulty), answers, skill stats.
window.PW_DATA = {
  user: {
    name: "Maya Chen",
    email: "maya@example.com"
  },
  skills: [{
    key: "words_in_context",
    label: "Words in Context",
    accuracy: 90,
    n: "9/10"
  }, {
    key: "central_idea",
    label: "Central Idea",
    accuracy: 78,
    n: "7/9"
  }, {
    key: "text_structure",
    label: "Text Structure",
    accuracy: 72,
    n: "8/11"
  }, {
    key: "transitions",
    label: "Transitions",
    accuracy: 66,
    n: "4/6"
  }, {
    key: "inferences",
    label: "Inferences",
    accuracy: 55,
    n: "6/11"
  }, {
    key: "command_of_evidence",
    label: "Command of Evidence",
    accuracy: 40,
    n: "2/5"
  }],
  recent: [{
    id: "s1",
    domain: "Reading & Writing",
    date: "Jun 20, 2026",
    score: 82,
    count: 10
  }, {
    id: "s2",
    domain: "Writing",
    date: "Jun 18, 2026",
    score: 70,
    count: 10
  }, {
    id: "s3",
    domain: "Reading",
    date: "Jun 16, 2026",
    score: 60,
    count: 5
  }, {
    id: "s4",
    domain: "Reading & Writing",
    date: "Jun 14, 2026",
    score: 90,
    count: 15
  }],
  // A short session for the interactive flow
  questions: [{
    domain: "Reading",
    skill: "Inferences",
    difficulty: "Medium",
    passage: "Marine biologist Dr. Lena Okafor noted that the reef's recovery, though encouraging, remained fragile. Coral that had bleached two summers earlier was regaining color, yet the surrounding fish populations had not rebounded at the same pace. She cautioned that visible signs of health could mask slower, structural changes still underway beneath the surface.",
    stem: "Which choice best states the main idea of the passage?",
    options: {
      A: "The reef has fully recovered from the earlier bleaching event.",
      B: "Surface signs of recovery may not reflect the reef's deeper condition.",
      C: "Fish populations recover faster than coral after bleaching.",
      D: "Dr. Okafor believes the reef will never recover."
    },
    answer: "B",
    explanation: "Dr. Okafor warns that visible health 'could mask slower, structural changes,' so apparent recovery may not reflect the deeper state of the reef. B captures this; A and D overstate, and C reverses the relationship."
  }, {
    domain: "Writing",
    skill: "Transitions",
    difficulty: "Easy",
    passage: "The museum's new wing was designed to use almost no artificial lighting during the day. ___ its broad skylights flood the galleries with sunlight from morning until late afternoon.",
    stem: "Which choice completes the text with the most logical transition?",
    options: {
      A: "Nevertheless,",
      B: "For example,",
      C: "Instead,",
      D: "However,"
    },
    answer: "B",
    explanation: "The second sentence gives a concrete illustration of the design goal stated first, so an example transition fits. 'For example' is correct; the others signal contrast or replacement."
  }, {
    domain: "Reading",
    skill: "Words in Context",
    difficulty: "Medium",
    passage: "Although the committee's report was exhaustive, its recommendations were anything but: they were terse, almost cryptic, leaving department heads to fill in the details themselves.",
    stem: "As used in the text, 'terse' most nearly means",
    options: {
      A: "lengthy",
      B: "rude",
      C: "concise",
      D: "confusing"
    },
    answer: "C",
    explanation: "'Terse' is contrasted with the 'exhaustive' report and paired with 'almost cryptic,' indicating brevity. 'Concise' fits best; 'rude' and 'confusing' miss the core meaning of shortness."
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/800path/data.js", error: String((e && e.message) || e) }); }

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
