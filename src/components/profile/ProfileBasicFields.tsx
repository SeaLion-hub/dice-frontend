"use client";

import * as React from "react";
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
import type { CollegeMajorsItem } from "@/hooks/useMajors";
import {
  GENDER_OPTIONS,
  ALLOWED_GRADES,
} from "@/lib/profileConfig";
import { FieldError } from "./FieldError";

type Props = {
  form: UseFormReturn<ProfileFormValues>;
  majors: CollegeMajorsItem[];
  majorsLoading: boolean;
};

export function ProfileBasicFields({ form, majors, majorsLoading }: Props) {
  const selectedCollege = form.watch("college");
  const selectedMajor = form.watch("major");
  const availableMajors = React.useMemo(() => {
    if (!selectedCollege) return [];
    return majors.find((item) => item.college === selectedCollege)?.majors ?? [];
  }, [majors, selectedCollege]);
  const hasSelectedCollegeOption =
    !!selectedCollege && majors.some((item) => item.college === selectedCollege);
  const hasSelectedMajorOption =
    !!selectedMajor && availableMajors.includes(selectedMajor);

  React.useEffect(() => {
    if (!selectedCollege || majorsLoading) return;
    const currentMajor = form.getValues("major");
    const target = majors.find((item) => item.college === selectedCollege);
    if (!target) return;
    if (currentMajor && !target.majors.includes(currentMajor)) {
      form.setValue("major", "", { shouldValidate: true });
    }
  }, [selectedCollege, majorsLoading, majors, form]);

  return (
    <div id="gender" className="space-y-4 scroll-mt-20">
      <div className="space-y-1.5">
        <Label htmlFor="gender">성별</Label>
        <Controller
          name="gender"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value ?? "prefer_not_to_say"} onValueChange={field.onChange}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="성별 선택" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((option) => (
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
        <Label htmlFor="age">나이</Label>
        <Input
          id="age"
          inputMode="numeric"
          placeholder="예: 23"
          {...form.register("age", {
            required: "나이를 입력해주세요",
            validate: (value) => {
              const num = Number(value);
              if (Number.isNaN(num)) return "숫자로 입력해주세요";
              if (num < 15 || num > 100) return "나이는 15~100 사이여야 합니다";
              return true;
            },
          })}
        />
        <FieldError message={form.formState.errors.age?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="grade">학년</Label>
        <Controller
          name="grade"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value ?? "1"} onValueChange={field.onChange}>
              <SelectTrigger id="grade">
                <SelectValue placeholder="학년 선택" />
              </SelectTrigger>
              <SelectContent>
                {ALLOWED_GRADES.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}학년
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="college">단과대학</Label>
        <Controller
          name="college"
          control={form.control}
          render={({ field }) => (
            <Select
              value={field.value || "__none"}
              onValueChange={(value: string) => {
                if (value === "__none") {
                  field.onChange("");
                  form.setValue("major", "", { shouldValidate: true });
                  return;
                }
                field.onChange(value);
                form.setValue("major", "", { shouldValidate: true });
              }}
            >
              <SelectTrigger id="college" disabled={majorsLoading}>
                <SelectValue placeholder={majorsLoading ? "불러오는 중..." : "단과대를 선택하세요"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">선택 안 함</SelectItem>
                {!hasSelectedCollegeOption && selectedCollege ? (
                  <SelectItem value={selectedCollege}>{selectedCollege} (이전 값)</SelectItem>
                ) : null}
                {majors.map((item) => (
                  <SelectItem key={item.college} value={item.college}>
                    {item.college}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={form.formState.errors.college?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="major">전공</Label>
        <Controller
          name="major"
          control={form.control}
          render={({ field }) => (
            <Select
              value={field.value || "__none"}
              onValueChange={(value: string) => {
                if (value === "__none") {
                  field.onChange("");
                } else {
                  field.onChange(value);
                }
              }}
              disabled={!selectedCollege}
            >
              <SelectTrigger id="major">
                <SelectValue placeholder={selectedCollege ? "전공을 선택하세요" : "먼저 단과대를 선택하세요"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">전공 선택 안 함</SelectItem>
                {!hasSelectedMajorOption && selectedMajor ? (
                  <SelectItem value={selectedMajor}>{selectedMajor} (이전 값)</SelectItem>
                ) : null}
                {availableMajors.map((major) => (
                  <SelectItem key={major} value={major}>
                    {major}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={form.formState.errors.major?.message} />
      </div>
    </div>
  );
}
