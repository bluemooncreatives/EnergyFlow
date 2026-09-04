import dynamic from 'next/dynamic'

const Editor = dynamic(() => import('./Editor'), {
    ssr: false,
    loading: () => (
        <div className="min-h-[300px] animate-pulse rounded-md border border-border/60 bg-muted/20" />
    ),
})

export default Editor
