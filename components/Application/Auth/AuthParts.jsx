'use client'

import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useWatch } from 'react-hook-form'
import { ArrowRight, Check, Eye, EyeOff, Loader2 } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { cn } from '@/lib/utils'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { NewsletterTitle } from '../Website/newsletter/NewsletterParts'
import { NO_REDUCED_MOTION } from './AuthShell'

gsap.registerPlugin(useGSAP)

/* Form-side building blocks for the auth pages. Styling: app/(root)/auth/auth.css
   plus the newsletter popup classes (.ef-nl-field, .ef-nl-submit, …).
   Anything marked data-auth-item staggers in when its AuthStep mounts. */

// One screen of a flow (sign in → code, email → code → new password). Key it
// by step so each new screen mounts fresh and staggers its items in.
export const AuthStep = ({ children, className }) => {
    const ref = useRef(null)

    useGSAP(() => {
        gsap.matchMedia().add(NO_REDUCED_MOTION, () => {
            gsap.from(ref.current.querySelectorAll('[data-auth-item]'), {
                autoAlpha: 0,
                y: 16,
                duration: 0.65,
                ease: 'power3.out',
                stagger: 0.06,
                delay: 0.2,
            })
        })
    }, { scope: ref })

    return <div ref={ref} className={cn('ef-auth-step', className)}>{children}</div>
}

// Eyebrow chip, the two-tone title with its swash, and the lead line.
export const AuthHeader = ({ eyebrow, title, accent, lead, children }) => (
    <div className="ef-auth-head">
        {eyebrow && <span data-auth-item className="ef-eyebrow w-fit">{eyebrow}</span>}
        <div data-auth-item>
            <NewsletterTitle as="h1" title={title} accent={accent} />
        </div>
        {lead && <p data-auth-item className="ef-nl-lead">{lead}</p>}
        {children}
    </div>
)

/**
 * A labelled react-hook-form field in the popup's style: leading icon,
 * inline error, and a show/hide toggle for passwords. `action` sits on the
 * label row (e.g. "Forgot password?"); `children` render under the field.
 */
export const AuthField = ({
    control,
    name,
    label,
    type = 'text',
    icon: Icon,
    placeholder,
    autoComplete,
    inputMode,
    action,
    children,
}) => {
    const [revealed, setRevealed] = useState(false)
    const isPassword = type === 'password'

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem data-auth-item className="gap-2">
                    <div className="flex items-center justify-between gap-3">
                        <FormLabel className="ef-auth-label">{label}</FormLabel>
                        {action}
                    </div>
                    <div className="ef-nl-input-wrap">
                        {Icon && <Icon className="ef-nl-input-icon" aria-hidden="true" />}
                        <FormControl>
                            <input
                                {...field}
                                type={isPassword && revealed ? 'text' : type}
                                placeholder={placeholder}
                                autoComplete={autoComplete}
                                inputMode={inputMode}
                                autoCapitalize={type === 'email' ? 'none' : undefined}
                                spellCheck={type === 'email' || isPassword ? false : undefined}
                                className={cn('ef-nl-field', !Icon && 'ef-nl-field--plain', isPassword && 'ef-auth-field--reveal')}
                            />
                        </FormControl>
                        {isPassword && (
                            <button
                                type="button"
                                className="ef-auth-reveal"
                                onClick={() => setRevealed((value) => !value)}
                                aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                                aria-pressed={revealed}
                            >
                                {revealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                            </button>
                        )}
                    </div>
                    {children}
                    <AuthMessage />
                </FormItem>
            )}
        />
    )
}

// FormMessage with the popup's error treatment (icon + error ink).
export const AuthMessage = () => (
    <FormMessage className="ef-auth-error" />
)

// Ticks off the password rules (lib/zodSchema.js) as the person types, so
// they meet them first time instead of reading them back as errors.
const PASSWORD_RULES = [
    { label: '8+ characters', test: (v) => v.length >= 8 },
    { label: 'Upper & lower case', test: (v) => /[A-Z]/.test(v) && /[a-z]/.test(v) },
    { label: 'A number', test: (v) => /[0-9]/.test(v) },
    { label: 'A symbol', test: (v) => /[^A-Za-z0-9]/.test(v) },
]

export const PasswordRules = ({ control, name = 'password' }) => {
    const value = useWatch({ control, name }) || ''

    return (
        <ul className="ef-auth-rules" aria-label="Password requirements">
            {PASSWORD_RULES.map(({ label, test }) => {
                const ok = test(value)
                return (
                    <li key={label} data-ok={ok}>
                        <span className="ef-auth-rules__dot" aria-hidden="true">{ok && <Check />}</span>
                        {label}
                        <span className="sr-only">{ok ? ', met' : ', not met yet'}</span>
                    </li>
                )
            })}
        </ul>
    )
}

export const AuthSubmit = ({ loading, loadingText = 'Please wait…', children }) => (
    <button type="submit" className="ef-nl-submit" disabled={loading} aria-busy={loading} data-auth-item>
        {loading ? (
            <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                <span>{loadingText}</span>
            </>
        ) : (
            <>
                <span>{children}</span>
                <ArrowRight aria-hidden="true" />
            </>
        )}
    </button>
)

export const AuthDivider = ({ children = 'or' }) => (
    <div className="ef-auth-divider" data-auth-item role="separator">{children}</div>
)

export const GoogleButton = ({ onClick, children = 'Continue with Google' }) => (
    <button type="button" className="ef-auth-social" onClick={onClick} data-auth-item>
        <FcGoogle aria-hidden="true" />
        {children}
    </button>
)

// "New here? Create an account" — the switch between auth pages.
export const AuthAlt = ({ children }) => (
    <p className="ef-auth-alt" data-auth-item>{children}</p>
)

// Numbered progress for multi-step flows (reset password).
export const AuthProgress = ({ steps, current }) => (
    <ol className="ef-auth-progress" data-auth-item aria-label={`Step ${current + 1} of ${steps.length}`}>
        {steps.map((label, i) => {
            const state = i < current ? 'done' : i === current ? 'current' : 'todo'
            return (
                <li key={label} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
                    <span className="ef-auth-progress__num" aria-hidden="true">
                        {state === 'done' ? <Check /> : i + 1}
                    </span>
                    <span className={cn(state !== 'current' && 'max-sm:sr-only')}>{label}</span>
                </li>
            )
        })}
    </ol>
)
