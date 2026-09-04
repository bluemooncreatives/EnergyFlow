'use client'
import { useMemo, useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';

import {
    ClassicEditor,
    Base64UploadAdapter,
    BlockQuote,
    Bold,
    Essentials,
    Heading,
    Image,
    ImageCaption,
    ImageResize,
    ImageStyle,
    ImageToolbar,
    ImageUpload,
    Italic,
    Link,
    List,
    Paragraph,
    Table,
    TableToolbar,
    Underline
} from 'ckeditor5';
import '@/app/ckeditor5.css';
 
import { decode } from 'entities';


/**
 * Create a free account with a trial: https://portal.ckeditor.com/checkout?plan=free
 */
const LICENSE_KEY = 'GPL'; // or <YOUR_LICENSE_KEY>.

export default function Editor({ onChange, initialData }) {
    const [hasEditorError, setHasEditorError] = useState(false);
    const [fallbackValue, setFallbackValue] = useState(initialData ? decode(initialData) : '');

    const { editorConfig } = useMemo(() => {
        return {
            editorConfig: {
                toolbar: {
                    items: [
                        'undo',
                        'redo',
                        '|',
                        'heading',
                        '|',
                        'bold',
                        'italic',
                        'underline',
                        '|',
                        'link',
                        'bulletedList',
                        'numberedList',
                        '|',
                        'insertImage',
                        'insertTable',
                        'blockQuote',
                    ],
                    shouldNotGroupWhenFull: true
                },
                plugins: [
                    Base64UploadAdapter,
                    BlockQuote,
                    Bold,
                    Essentials,
                    Heading,
                    Image,
                    ImageCaption,
                    ImageResize,
                    ImageStyle,
                    ImageToolbar,
                    ImageUpload,
                    Italic,
                    Link,
                    List,
                    Paragraph,
                    Table,
                    TableToolbar,
                    Underline
                ],
                placeholder: 'Write product description...',
                heading: {
                    options: [
                        {
                            model: 'paragraph',
                            title: 'Paragraph',
                            class: 'ck-heading_paragraph'
                        },
                        {
                            model: 'heading1',
                            view: 'h1',
                            title: 'Heading 1',
                            class: 'ck-heading_heading1'
                        },
                        {
                            model: 'heading2',
                            view: 'h2',
                            title: 'Heading 2',
                            class: 'ck-heading_heading2'
                        },
                        {
                            model: 'heading3',
                            view: 'h3',
                            title: 'Heading 3',
                            class: 'ck-heading_heading3'
                        }
                    ]
                },
                image: {
                    toolbar: [
                        'toggleImageCaption',
                        'imageStyle:inline',
                        'imageStyle:wrapText',
                        'resizeImage'
                    ]
                },
                initialData: initialData && initialData != '' ? decode(initialData) : '',
                licenseKey: LICENSE_KEY,
                link: {
                    addTargetToExternalLinks: true,
                    defaultProtocol: 'https://',
                    decorators: {
                        toggleDownloadable: {
                            mode: 'manual',
                            label: 'Downloadable',
                            attributes: {
                                download: 'file'
                            }
                        }
                    }
                },
                list: {
                    properties: {
                        styles: true
                    }
                },
                table: {
                    contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
                }
            }
        };
    }, [initialData]);

    if (hasEditorError) {
        return (
            <textarea
                className="min-h-[220px] w-full rounded-md border bg-background p-3 text-sm"
                placeholder="Write product description..."
                value={fallbackValue}
                onChange={(event) => {
                    setFallbackValue(event.target.value);
                    if (typeof onChange === 'function') {
                        onChange(event, {
                            getData: () => event.target.value,
                        });
                    }
                }}
            />
        );
    }

    return (
        <div>
            <CKEditor
                editor={ClassicEditor}
                config={editorConfig}
                onChange={onChange}
                onError={() => setHasEditorError(true)}
            />
        </div>
    );
}
