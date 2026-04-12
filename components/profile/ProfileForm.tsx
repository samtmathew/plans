'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema, type ProfileFormValues } from '@/lib/validations/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Profile } from '@/types'

interface ProfileFormProps {
  defaultValues?: Partial<Profile>
  onSubmit: (values: ProfileFormValues) => Promise<void>
  submitLabel?: string
}

export function ProfileForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Save',
}: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      bio: defaultValues?.bio ?? null,
      date_of_birth: defaultValues?.date_of_birth ?? null,
      gender: defaultValues?.gender ?? null,
      instagram: defaultValues?.instagram ?? null,
      linkedin: defaultValues?.linkedin ?? null,
      twitter_x: defaultValues?.twitter_x ?? null,
    },
  })

  const bio = watch('bio') ?? ''

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name *</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date_of_birth">Date of birth *</Label>
        <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
        {errors.date_of_birth && (
          <p className="text-xs text-destructive">{errors.date_of_birth.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="gender">Gender</Label>
        <Select
          defaultValue={defaultValues?.gender ?? undefined}
          onValueChange={(v) => setValue('gender', v)}
        >
          <SelectTrigger id="gender">
            <SelectValue placeholder="Select (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="non_binary">Non-binary</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          rows={3}
          maxLength={200}
          placeholder="A short bio (optional)"
          {...register('bio')}
        />
        <p className="text-xs text-muted-foreground text-right">{bio.length}/200</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="instagram">Instagram handle</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
          <Input id="instagram" placeholder="username" className="pl-7" {...register('instagram')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="linkedin">LinkedIn URL</Label>
        <Input id="linkedin" type="url" placeholder="https://linkedin.com/in/…" {...register('linkedin')} />
        {errors.linkedin && (
          <p className="text-xs text-destructive">{errors.linkedin.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="twitter_x">X / Twitter handle</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
          <Input id="twitter_x" placeholder="username" className="pl-7" {...register('twitter_x')} />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
