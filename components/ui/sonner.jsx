"use client"

import { Toaster as Sonner } from "sonner"

const Toaster = (props) => {
  return (
    <Sonner
      position="top-right"
      closeButton
      richColors
      duration={5000}
      {...props}
    />
  )
}

export { Toaster }
