"use client";

import { useId } from "react";
import type { Mode } from "@/lib/analysis";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <div className="select-field">
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <Select
        items={options}
        value={String(value)}
        onValueChange={(nextValue) => {
          if (nextValue !== null) onChange(nextValue);
        }}
      >
        <SelectTrigger
          id={id}
          aria-labelledby={`${id}-label`}
          className="dashboard-select-trigger"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          align="start"
          alignItemWithTrigger={false}
          className="dashboard-select-content"
        >
          <SelectGroup>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="dashboard-select-item"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
export function ViewToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
}) {
  return (
    <div className="view-toggle" role="group" aria-label="Merski prikaz">
      <button
        type="button"
        aria-pressed={mode === "count"}
        onClick={() => onChange("count")}
      >
        Število
      </button>
      <button
        type="button"
        aria-pressed={mode === "percent"}
        onClick={() => onChange("percent")}
      >
        Delež (%)
      </button>
    </div>
  );
}
