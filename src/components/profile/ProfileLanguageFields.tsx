"use client";

import { Controller, type UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import type { ProfileFormValues } from "@/types/profile";
import { TESTS } from "@/lib/profileConfig";

type Props = {
  form: UseFormReturn<ProfileFormValues>;
};

export function ProfileLanguageFields({ form }: Props) {
  const languageScores = form.watch("languageScores");

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-900">어학 점수 (선택)</p>
      {TESTS.map(({ key, label }) => {
        const enabled = languageScores?.[key]?.enabled ?? false;
        return (
          <div
            key={key}
            className="flex flex-col gap-2 rounded-md border border-gray-200 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-2 text-sm text-gray-800">
              <Controller
                name={`languageScores.${key}.enabled` as const}
                control={form.control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    ref={field.ref}
                  />
                )}
              />
              <span>{label}</span>
            </div>

            <Controller
              name={`languageScores.${key}.score` as const}
              control={form.control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="점수"
                  className="sm:w-40"
                  disabled={!enabled}
                />
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
