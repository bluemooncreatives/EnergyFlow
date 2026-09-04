import { Loader2 } from "lucide-react"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
const ButtonLoading = ({ type, text, loading, className = "", onClick, size = "lg", ...props }) => {
    const hasExplicitSize = className && (className.includes("h-") || className.includes("py-"));
    const sizeHeightMap = {
        default: "h-8",
        sm: "h-7",
        lg: "h-9",
    };
    const heightClass = hasExplicitSize ? "" : (sizeHeightMap[size] || sizeHeightMap.default);

    return (
        <Button
            type={type}
            disabled={loading}
            onClick={onClick}
            size={size}
            className={cn(heightClass, className)}
            {...props} >
            {loading &&
                <Loader2 className="animate-spin" />
            }
            {text}
        </Button>
    )
}

export default ButtonLoading