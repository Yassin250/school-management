import { UseFormRegister, FieldError } from "react-hook-form";

type Props = {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  type?: string;
  defaultValue?: string;
  hidden?: boolean;
  placeholder?: string;
};

export default function InputField({
  label,
  name,
  register,
  error,
  type = "text",
  defaultValue,
  hidden,
  placeholder,
}: Props) {
  return (
    <div className={`flex flex-col gap-1 w-full md:w-[calc(50%-0.5rem)] ${hidden ? "hidden" : ""}`}>
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <input
        type={type}
        {...register(name)}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-300" : "border-gray-200"
        }`}
      />
      {error && <p className="text-xs text-red-500">{error.message}</p>}
    </div>
  );
}