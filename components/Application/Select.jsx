'use client'
import * as React from "react";
import { useState } from "react";
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from "@/components/ui/command";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CheckIcon, ChevronDown, PlusIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

function Select({
   options,
   selected,
   setSelected,
   placeholder = "Select options",
   isMulti = false, // Added prop to determine if multi-select is enabled
   onCreate, // When set, typing a value that isn't listed offers an "Add" row
}) {
   const [open, setOpen] = useState(false);
   const [search, setSearch] = useState("");

   const searchTerm = search.trim();
   const canCreate = Boolean(onCreate) && searchTerm.length > 0
       && !options.some((o) => String(o.label).toLowerCase() === searchTerm.toLowerCase());

   const handleOpenChange = (next) => {
       setOpen(next);
       if (!next) setSearch("");
   };

   const handleCreate = () => {
       const option = onCreate(searchTerm);
       setSearch("");
       if (option) handleSelect(option);
   };

   const handleSelect = (option) => {
       if (isMulti) {
           // If multi-select, toggle the option
           if (selected.includes(option.value)) {
               setSelected(selected.filter((s) => s !== option.value));
           } else {
               setSelected([...selected, option.value]);
           }
       } else {
           // If single-select, set the selected option directly (non-array value)
           setSelected(option.value);
           handleOpenChange(false); // Close the dropdown after selection in single-select
       }
   };


   const handleRemove = (value) => {
       setSelected(selected.filter((s) => s !== value));
   };

   const handleClearAll = () => {
       setSelected(isMulti ? [] : null);
   };

   return (
       <Popover open={open} onOpenChange={handleOpenChange}>
           <PopoverTrigger className="w-full" asChild>
               <Button
                   variant="outline"
                   role="combobox"
                   aria-expanded={open}
                   className="h-auto min-h-9 justify-between whitespace-normal text-left dark:bg-card"
               >
                   <div className="flex flex-wrap items-center gap-1">

                       {Array.isArray(selected) && selected.length > 0
                           ?
                           selected.map((value) => {
                               const option = options.find((o) => o.value === value);
                               return (
                                   <Badge key={value}>
                                       {option?.label ?? value}
                                       <span onClick={(e) => { e.stopPropagation(e); handleRemove(value) }} >
                                           <XIcon className="ml-1 h-4 w-4 cursor-pointer" />
                                       </span>
                                   </Badge>
                               )
                           })
                           :
                           selected && options.find((o) => o.value === selected)?.label || placeholder
                       }

                   </div>

                   <div className="flex shrink-0 items-center gap-2">
                       {selected && selected.length > 0 &&
                           <span onClick={(e) => { e.stopPropagation(); handleClearAll() }}>
                               <XIcon className="h-4 w-4 shrink-0 opacity-50" />
                           </span>
                       }
                       <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                   </div>
               </Button>
           </PopoverTrigger>
           <PopoverContent align="start" className="p-0">
               <Command>
                   <CommandList>
                       <CommandInput
                           placeholder={onCreate ? "Search or add new..." : "Search options..."}
                           value={search}
                           onValueChange={setSearch}
                       />
                       {!canCreate && <CommandEmpty>No options found.</CommandEmpty>}
                       <CommandGroup>
                           {options.map((option) => (
                               <CommandItem
                                   key={option.value}
                                   value={option.label}
                                   onSelect={() => handleSelect(option)}
                               >
                                   {option.label}
                                   <CheckIcon
                                       className={cn(
                                           "ml-auto h-4 w-4",
                                           (isMulti
                                               ? selected.includes(option.value)
                                               : selected === option.value)
                                               ? "opacity-100"
                                               : "opacity-0"
                                       )}
                                   />
                               </CommandItem>
                           ))}
                           {/* Last, so Enter still picks a partial match first; forceMount keeps it out of cmdk's filtering. */}
                           {canCreate && (
                               <CommandItem
                                   forceMount
                                   value={`__create__${searchTerm}`}
                                   onSelect={handleCreate}
                               >
                                   <PlusIcon className="h-4 w-4" />
                                   Add &quot;{searchTerm}&quot;
                               </CommandItem>
                           )}
                       </CommandGroup>
                   </CommandList>
               </Command>
           </PopoverContent>
       </Popover>
   );
}

export default Select;
