'use client'
import { useEffect, useMemo, useRef, useState } from "react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Select from "@/components/Application/Select"
import ButtonLoading from "@/components/Application/ButtonLoading"
import { showToast } from "@/lib/showToast"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import slugify from "slugify"
import axios from "axios"
import { Plus, Trash2 } from "lucide-react"

const SIZE_GUIDE_TYPES = [
    "bottomwear",
    "maxi-skirt",
    "topwear",
    "dress-bodycon",
    "dress-flowy",
    "coord-set",
    "ethnic",
    "free-size",
]

const TYPE_OPTIONS = SIZE_GUIDE_TYPES.map((type) => ({
    label: type.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    value: type,
}))

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const createColumn = (label = "") => ({
    id: createId(),
    label,
})

const createRow = (columns) => ({
    id: createId(),
    values: columns.reduce((acc, column) => {
        acc[column.id] = ""
        return acc
    }, {})
})

const toColumnKey = (label) => {
    const slug = slugify(label || "", { lower: true, strict: true })
    return slug.replace(/-/g, "_")
}

const formSchema = z.object({
    name: z.string().min(2, "Name is required."),
    slug: z.string().min(2, "Slug is required."),
    type: z.enum(SIZE_GUIDE_TYPES, { required_error: "Type is required." }),
    note: z.string().optional(),
})

const buildColumns = (labels) => {
    const safeLabels = Array.isArray(labels) ? labels : []
    const columns = safeLabels.map((label) => createColumn(String(label || "").trim()))
    return columns.length ? columns : [createColumn("Size")]
}

const buildRows = (columns, rows) => {
    const keyLookup = columns.map((column) => toColumnKey(column.label))
    const safeRows = Array.isArray(rows) ? rows : []

    const mappedRows = safeRows.map((row) => {
        const values = columns.reduce((acc, column, index) => {
            const columnKey = keyLookup[index]
            acc[column.id] = row && columnKey ? row[columnKey] ?? "" : ""
            return acc
        }, {})
        return { id: createId(), values }
    })

    return mappedRows.length ? mappedRows : [createRow(columns)]
}

const validateTable = (form, columns, rows) => {
    form.clearErrors(["columns", "rows"])

    const trimmedLabels = columns.map((column) => String(column.label || "").trim())
    if (!trimmedLabels.length || trimmedLabels.some((label) => !label)) {
        form.setError("columns", { type: "manual", message: "All columns must have a label." })
        return null
    }

    const columnKeys = trimmedLabels.map(toColumnKey)
    if (columnKeys.some((key) => !key)) {
        form.setError("columns", { type: "manual", message: "Column labels must include letters or numbers." })
        return null
    }

    const uniqueKeys = new Set(columnKeys)
    if (uniqueKeys.size !== columnKeys.length) {
        form.setError("columns", { type: "manual", message: "Column labels must be unique." })
        return null
    }

    if (!rows.length) {
        form.setError("rows", { type: "manual", message: "Add at least one row." })
        return null
    }

    const hasEmptyRow = rows.some((row) => {
        const values = columns.map((column) => String(row.values[column.id] ?? "").trim())
        return values.every((value) => !value)
    })

    if (hasEmptyRow) {
        form.setError("rows", { type: "manual", message: "Each row should have at least one value." })
        return null
    }

    const rowsPayload = rows.map((row) => {
        return columns.reduce((acc, column, index) => {
            const key = columnKeys[index]
            acc[key] = row.values[column.id]
            return acc
        }, {})
    })

    return {
        columns: trimmedLabels,
        rows: rowsPayload,
    }
}

const SizeGuideBuilder = ({ mode = "create", sizeGuideId = "" }) => {
    const initialColumns = useMemo(() => [createColumn("Size")], [])
    const [columns, setColumns] = useState(initialColumns)
    const [rows, setRows] = useState(() => [createRow(initialColumns)])
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(mode === "edit")
    const hasLoadedRef = useRef(false)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            slug: "",
            type: "",
            note: "",
        },
    })

    const columnsError = form.formState.errors?.columns?.message
    const rowsError = form.formState.errors?.rows?.message
    const noteValue = form.watch("note")
    const nameValue = form.watch("name")

    useEffect(() => {
        if (nameValue) {
            form.setValue("slug", slugify(nameValue).toLowerCase())
        }
    }, [nameValue, form])

    useEffect(() => {
        if (mode !== "edit") {
            setInitialLoading(false)
            return
        }

        if (!sizeGuideId) {
            setInitialLoading(false)
            showToast("error", "Invalid size guide id.")
            return
        }

        if (hasLoadedRef.current) return

        const fetchSizeGuide = async () => {
            setInitialLoading(true)
            try {
                const { data: response } = await axios.get(`/api/size-guide/${sizeGuideId}`)
                if (!response.success) {
                    throw new Error(response.message)
                }

                const data = response.data
                form.reset({
                    name: data?.name || "",
                    slug: data?.slug || "",
                    type: data?.type || "",
                    note: data?.note || "",
                })

                const nextColumns = buildColumns(data?.columns)
                const nextRows = buildRows(nextColumns, data?.rows)
                setColumns(nextColumns)
                setRows(nextRows)

                hasLoadedRef.current = true
            } catch (error) {
                showToast("error", error.message)
            } finally {
                setInitialLoading(false)
            }
        }

        fetchSizeGuide()
    }, [mode, sizeGuideId, form])

    const addColumn = () => {
        const newColumn = createColumn("")
        setColumns((prev) => [...prev, newColumn])
        setRows((prev) =>
            prev.map((row) => ({
                ...row,
                values: {
                    ...row.values,
                    [newColumn.id]: "",
                },
            }))
        )
    }

    const removeColumn = (columnId) => {
        if (columns.length <= 1) {
            showToast("error", "At least one column is required.")
            return
        }

        setColumns((prev) => prev.filter((column) => column.id !== columnId))
        setRows((prev) =>
            prev.map((row) => {
                const nextValues = { ...row.values }
                delete nextValues[columnId]
                return { ...row, values: nextValues }
            })
        )
    }

    const updateColumnLabel = (columnId, value) => {
        setColumns((prev) =>
            prev.map((column) =>
                column.id === columnId ? { ...column, label: value } : column
            )
        )
        form.clearErrors("columns")
    }

    const addRow = () => {
        setRows((prev) => [...prev, createRow(columns)])
    }

    const removeRow = (rowId) => {
        if (rows.length <= 1) {
            showToast("error", "At least one row is required.")
            return
        }
        setRows((prev) => prev.filter((row) => row.id !== rowId))
    }

    const updateCell = (rowId, columnId, value) => {
        setRows((prev) =>
            prev.map((row) => {
                if (row.id !== rowId) return row
                return {
                    ...row,
                    values: {
                        ...row.values,
                        [columnId]: value,
                    },
                }
            })
        )
        form.clearErrors("rows")
    }

    const handleSubmit = async (values) => {
        const tablePayload = validateTable(form, columns, rows)
        if (!tablePayload) return

        setLoading(true)
        try {
            const payload = {
                ...values,
                columns: tablePayload.columns,
                rows: tablePayload.rows,
            }

            if (mode === "edit") {
                payload._id = sizeGuideId
                const { data: response } = await axios.put("/api/size-guide/update", payload)
                if (!response.success) {
                    throw new Error(response.message)
                }
                showToast("success", response.message)
            } else {
                const { data: response } = await axios.post("/api/size-guide/create", payload)
                if (!response.success) {
                    throw new Error(response.message)
                }

                form.reset({ name: "", slug: "", type: "", note: "" })
                const resetColumns = [createColumn("Size")]
                setColumns(resetColumns)
                setRows([createRow(resetColumns)])
                showToast("success", response.message)
            }
        } catch (error) {
            showToast("error", error.message)
        } finally {
            setLoading(false)
        }
    }

    const previewColumns = useMemo(() => {
        return columns.map((column, index) => ({
            id: column.id,
            label: column.label?.trim() || `Column ${index + 1}`,
        }))
    }, [columns])

    if (mode === "edit" && initialLoading) {
        return (
            <div className="rounded-md bg-card p-4 sm:p-6">
                <p className="text-sm text-muted-foreground">Loading size guide...</p>
            </div>
        )
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-md bg-card p-4 sm:p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)}>
                        <div className="grid gap-5 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Name <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="text" placeholder="Enter guide name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="slug"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Slug <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="text" placeholder="Enter slug" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Type <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Select
                                                options={TYPE_OPTIONS}
                                                selected={field.value}
                                                setSelected={field.onChange}
                                                isMulti={false}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="note"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Note</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Add notes for this size guide" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold">Size Table</h3>
                                <p className="text-sm text-muted-foreground">Add columns and rows to build the chart.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button type="button" variant="outline" size="lg" className="h-9" onClick={addColumn}>
                                    <Plus className="size-4" />
                                    Add Column
                                </Button>
                                <Button type="button" variant="outline" size="lg" className="h-9" onClick={addRow}>
                                    <Plus className="size-4" />
                                    Add Row
                                </Button>
                            </div>
                        </div>

                        <div className="mt-4 rounded-md border">
                            <Table className="min-w-[640px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-14">#</TableHead>
                                        {columns.map((column) => (
                                            <TableHead key={column.id} className="min-w-[160px]">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="text"
                                                        value={column.label}
                                                        placeholder="Column label"
                                                        onChange={(event) => updateColumnLabel(column.id, event.target.value)}
                                                        className="h-8"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeColumn(column.id)}
                                                        className="h-8 w-8"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </TableHead>
                                        ))}
                                        <TableHead className="w-14"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((row, rowIndex) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-medium">{rowIndex + 1}</TableCell>
                                            {columns.map((column) => (
                                                <TableCell key={column.id}>
                                                    <Input
                                                        type="text"
                                                        value={row.values[column.id] ?? ""}
                                                        placeholder={previewColumns.find((item) => item.id === column.id)?.label}
                                                        onChange={(event) => updateCell(row.id, column.id, event.target.value)}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                            ))}
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeRow(row.id)}
                                                    className="h-8 w-8"
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {columnsError ? (
                            <p className="mt-2 text-sm text-destructive">{columnsError}</p>
                        ) : null}
                        {rowsError ? (
                            <p className="mt-2 text-sm text-destructive">{rowsError}</p>
                        ) : null}

                        <div className="mt-6">
                            <ButtonLoading
                                loading={loading}
                                type="submit"
                                text={mode === "edit" ? "Update Size Guide" : "Save Size Guide"}
                                size="lg"
                                className="h-9 cursor-pointer"
                            />
                        </div>
                    </form>
                </Form>
            </div>

            <div className="rounded-md bg-card p-4 sm:p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold">Live Preview</h3>
                    <p className="text-sm text-muted-foreground">See how your size guide will look.</p>
                </div>

                <div className="rounded-md border">
                    <Table className="min-w-[520px]">
                        <TableHeader>
                            <TableRow>
                                {previewColumns.map((column) => (
                                    <TableHead key={column.id}>{column.label}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row) => (
                                <TableRow key={row.id}>
                                    {previewColumns.map((column) => (
                                        <TableCell key={column.id}>
                                            {row.values[column.id] ? row.values[column.id] : "-"}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-4 rounded-md bg-muted/40 p-3">
                    <p className="text-sm font-medium">Note</p>
                    <p className="text-sm text-muted-foreground">
                        {noteValue ? noteValue : "No note provided."}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default SizeGuideBuilder
