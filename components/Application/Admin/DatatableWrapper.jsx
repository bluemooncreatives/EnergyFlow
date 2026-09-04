'use client'

import Datatable from "./Datatable"
import { useEffect, useState } from "react"

const DatatableWrapper = ({
    queryKey,
    fetchUrl,
    columnsConfig,
    initialPageSize = 10,
    exportEndpoint,
    deleteEndpoint,
    deleteType,
    trashView,
    createAction
}) => {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <Datatable
            queryKey={queryKey}
            fetchUrl={fetchUrl}
            columnsConfig={columnsConfig}
            initialPageSize={initialPageSize}
            exportEndpoint={exportEndpoint}
            deleteEndpoint={deleteEndpoint}
            deleteType={deleteType}
            trashView={trashView}
            createAction={createAction}
        />
    )
}

export default DatatableWrapper