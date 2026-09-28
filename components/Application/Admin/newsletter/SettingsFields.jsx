'use client'

import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

/* Form building blocks for Admin → Newsletter → Customise. All of them are
   react-hook-form fields bound by `name` (dot paths into the settings). */

// A titled card that groups related settings inside a tab.
export const FieldGroup = ({ title, description, action, children, className }) => (
    <section className={cn('rounded-md bg-card p-4 sm:p-6', className)}>
        <div className="mb-4 flex items-start justify-between gap-3">
            <div>
                <h3 className="text-sm font-semibold">{title}</h3>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {action}
        </div>
        <div className="flex flex-col gap-5">{children}</div>
    </section>
)

export const TextField = ({ control, name, label, placeholder, hint, maxLength, type = 'text', className }) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem className={className}>
                <FormLabel className="flex w-full items-center justify-between gap-2">
                    <span>{label}</span>
                    {maxLength && type === 'text' && (
                        <span className="text-xs font-normal tabular-nums text-muted-foreground">
                            {String(field.value ?? '').length}/{maxLength}
                        </span>
                    )}
                </FormLabel>
                <FormControl>
                    <Input
                        type={type}
                        placeholder={placeholder}
                        maxLength={type === 'text' ? maxLength : undefined}
                        {...field}
                        value={field.value ?? ''}
                    />
                </FormControl>
                {hint && <FormDescription>{hint}</FormDescription>}
                <FormMessage />
            </FormItem>
        )}
    />
)

export const AreaField = ({ control, name, label, placeholder, hint, maxLength, rows = 3 }) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabel className="flex w-full items-center justify-between gap-2">
                    <span>{label}</span>
                    {maxLength && (
                        <span className="text-xs font-normal tabular-nums text-muted-foreground">
                            {String(field.value ?? '').length}/{maxLength}
                        </span>
                    )}
                </FormLabel>
                <FormControl>
                    <Textarea rows={rows} placeholder={placeholder} maxLength={maxLength} {...field} value={field.value ?? ''} />
                </FormControl>
                {hint && <FormDescription>{hint}</FormDescription>}
                <FormMessage />
            </FormItem>
        )}
    />
)

// Accessible on/off switch styled like the admin's primary controls.
export const Switch = ({ checked, onCheckedChange, id, disabled, label }) => (
    <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
            checked ? 'bg-primary' : 'bg-input'
        )}
    >
        <span
            className={cn(
                'pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform',
                checked ? 'translate-x-4' : 'translate-x-0.5'
            )}
        />
    </button>
)

export const SwitchField = ({ control, name, label, description }) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem className="flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border p-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <FormLabel className="text-sm font-medium">{label}</FormLabel>
                    {description && <FormDescription className="text-xs">{description}</FormDescription>}
                </div>
                <FormControl>
                    <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} label={label} />
                </FormControl>
                <FormMessage className="basis-full" />
            </FormItem>
        )}
    />
)

/**
 * Visual single-choice picker (layouts, themes, positions). Each option can
 * carry a small `visual` node drawn above its label.
 */
export const ChoiceField = ({ control, name, label, options, columns = 3 }) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
                {label && <FormLabel>{label}</FormLabel>}
                <div
                    role="radiogroup"
                    aria-label={label}
                    className={cn('grid gap-3', columns === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}
                >
                    {options.map((opt) => {
                        const active = field.value === opt.value
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() => field.onChange(opt.value)}
                                className={cn(
                                    'flex flex-col gap-2 rounded-lg border p-2.5 text-left transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                                    active ? 'border-primary ring-2 ring-primary/25' : 'hover:border-foreground/30'
                                )}
                            >
                                {opt.visual}
                                <span className="text-sm font-medium">{opt.label}</span>
                                {opt.description && <span className="text-xs leading-snug text-muted-foreground">{opt.description}</span>}
                            </button>
                        )
                    })}
                </div>
                <FormMessage />
            </FormItem>
        )}
    />
)

// Up to four short bullet perks.
export const PerksField = ({ control, name, label = 'Perks', max = 4 }) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => {
            const list = Array.isArray(field.value) ? field.value : []
            const update = (next) => field.onChange(next)
            return (
                <FormItem>
                    <FormLabel className="flex w-full items-center justify-between">
                        <span>{label}</span>
                        <span className="text-xs font-normal text-muted-foreground">{list.length}/{max}</span>
                    </FormLabel>
                    <div className="flex flex-col gap-2">
                        {list.map((perk, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Input
                                    value={perk}
                                    maxLength={60}
                                    placeholder={`Perk ${i + 1}`}
                                    aria-label={`Perk ${i + 1}`}
                                    onChange={(e) => update(list.map((p, j) => (j === i ? e.target.value : p)))}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="size-8 shrink-0 text-destructive hover:text-destructive/80"
                                    onClick={() => update(list.filter((_, j) => j !== i))}
                                    aria-label={`Remove perk ${i + 1}`}
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        ))}
                        {list.length < max && (
                            <Button type="button" variant="outline" className="h-8 w-fit" onClick={() => update([...list, ''])}>
                                <Plus className="size-4" /> Add perk
                            </Button>
                        )}
                    </div>
                    <FormDescription>Short benefits with a check mark. Leave empty to hide the list.</FormDescription>
                    <FormMessage />
                </FormItem>
            )
        }}
    />
)
