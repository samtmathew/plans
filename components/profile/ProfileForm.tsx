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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant">Full name *</Label>
        <Input id="name" className="border-0 border-b border-primary bg-transparent text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-0" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date_of_birth" className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant">Date of birth *</Label>
        <Input id="date_of_birth" type="date" className="border-0 border-b border-primary bg-transparent text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-0" {...register('date_of_birth')} />
        {errors.date_of_birth && (
          <p className="text-xs text-destructive">{errors.date_of_birth.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender" className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant">Gender</Label>
        <Select
          defaultValue={defaultValues?.gender ?? undefined}
          onValueChange={(v) => setValue('gender', v)}
        >
          <SelectTrigger id="gender" className="border-0 border-b border-primary bg-transparent text-on-surface placeholder:text-on-surface-variant">
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

      <div className="space-y-2">
        <Label htmlFor="bio" className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant">Bio</Label>
        <Textarea
          id="bio"
          rows={3}
          maxLength={200}
          placeholder="A short bio (optional)"
          className="border border-outline-variant rounded-lg bg-surface-container-low text-on-surface placeholder:text-on-surface-variant"
          {...register('bio')}
        />
        <p className="text-xs text-on-surface-variant text-right">{bio.length}/200</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instagram" className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant">Instagram handle</Label>
        <div className="relative">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">@</span>
          <Input id="instagram" placeholder="username" className="pl-6 border-0 border-b border-primary bg-transparent text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-0" {...register('instagram')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedin" className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant">LinkedIn URL</Label>
        <Input id="linkedin" type="url" placeholder="https://linkedin.com/in/…" className="border-0 border-b border-primary bg-transparent text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-0" {...register('linkedin')} />
        {errors.linkedin && (
          <p className="text-xs text-destructive">{errors.linkedin.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="twitter_x" className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant">X / Twitter handle</Label>
        <div className="relative">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">@</span>
          <Input id="twitter_x" placeholder="username" className="pl-6 border-0 border-b border-primary bg-transparent text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-0" {...register('twitter_x')} />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
