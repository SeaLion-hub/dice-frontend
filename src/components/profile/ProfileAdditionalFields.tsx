"use client";

import { Controller, type UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProfileFormValues } from "@/types/profile";
import { MILITARY_OPTIONS, INCOME_OPTIONS } from "@/lib/profileConfig";
import { FieldError } from "./FieldError";

type Props = {
  form: UseFormReturn<ProfileFormValues>;
};

export function ProfileAdditionalFields({ form }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="military_service">병역 (선택)</Label>
        <Controller
          name="military_service"
          control={form.control}
          render={({ field }) => (
            <Select
              value={field.value || "__none"}
              onValueChange={(value) => field.onChange(value === "__none" ? "" : value)}
            >
              <SelectTrigger id="military_service">
                <SelectValue placeholder="병역을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">선택 안 함</SelectItem>
                {MILITARY_OPTIONS.filter((option) => option.value !== "").map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="income_bracket">소득 분위 (선택)</Label>
        <Controller
          name="income_bracket"
          control={form.control}
          render={({ field }) => (
            <Select
              value={field.value || "__none"}
              onValueChange={(value) => field.onChange(value === "__none" ? "" : value)}
            >
              <SelectTrigger id="income_bracket">
                <SelectValue placeholder="소득 분위" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">선택 안 함</SelectItem>
                {INCOME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="gpa">학점 (선택)</Label>
        <Input
          id="gpa"
          inputMode="decimal"
          placeholder="예: 3.75"
          {...form.register("gpa", {
            validate: (value) => {
              if (!value) return true;
              const num = Number(value);
              if (Number.isNaN(num)) return "숫자로 입력해주세요";
              if (num < 0 || num > 4.5) return "0.00~4.50 범위여야 합니다";
              return true;
            },
          })}
        />
        <FieldError message={form.formState.errors.gpa?.message} />
      </div>
    </div>
  );
}
