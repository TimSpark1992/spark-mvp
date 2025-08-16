import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

export function FormField({ 
  label, 
  error, 
  required = false, 
  children, 
  className,
  description 
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export function FormInput({ 
  label, 
  error, 
  required, 
  className,
  description,
  ...props 
}) {
  return (
    <FormField 
      label={label} 
      error={error} 
      required={required} 
      className={className}
      description={description}
    >
      <Input 
        className={cn(
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
          'transition-colors'
        )}
        {...props} 
      />
    </FormField>
  )
}

export function FormTextarea({ 
  label, 
  error, 
  required, 
  className,
  description,
  ...props 
}) {
  return (
    <FormField 
      label={label} 
      error={error} 
      required={required} 
      className={className}
      description={description}
    >
      <Textarea 
        className={cn(
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
          'transition-colors'
        )}
        {...props} 
      />
    </FormField>
  )
}

export function FormSelect({ 
  label, 
  error, 
  required, 
  className,
  description,
  options = [],
  placeholder = "Select an option",
  value,
  onValueChange,
  ...props 
}) {
  return (
    <FormField 
      label={label} 
      error={error} 
      required={required} 
      className={className}
      description={description}
    >
      <Select value={value} onValueChange={onValueChange} {...props}>
        <SelectTrigger className={cn(
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
          'transition-colors'
        )}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem 
              key={typeof option === 'string' ? option : option.value} 
              value={typeof option === 'string' ? option : option.value}
            >
              {typeof option === 'string' ? option : option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )
}

export function FormRadioGroup({ 
  label, 
  error, 
  required, 
  className,
  description,
  options = [],
  value,
  onValueChange,
  ...props 
}) {
  return (
    <FormField 
      label={label} 
      error={error} 
      required={required} 
      className={className}
      description={description}
    >
      <RadioGroup 
        value={value} 
        onValueChange={onValueChange} 
        className="grid grid-cols-2 gap-4"
        {...props}
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={option.value} />
            <Label 
              htmlFor={option.value}
              className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer flex-1"
            >
              {option.icon && <option.icon className="mb-2 h-6 w-6" />}
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </FormField>
  )
}