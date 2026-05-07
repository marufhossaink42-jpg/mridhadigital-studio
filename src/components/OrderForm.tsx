import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'motion/react';
import { Upload, CheckCircle2, Loader2, Phone, User, FileText, ChevronDown, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

const orderSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().min(11, "Phone number must be at least 11 digits").max(14, "Too long"),
  serviceType: z.enum(["B&W Photocopy", "Passport Photo Printing", "Online Application"]),
  document: z.any().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

interface OrderFormProps {
  onSubmit: (values: OrderFormValues & { documentBase64?: string }) => Promise<void>;
}

export default function OrderForm({ onSubmit }: OrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      serviceType: "B&W Photocopy",
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onFormSubmit = async (data: OrderFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit({ ...data, documentBase64: filePreview || undefined });
      reset();
      setFilePreview(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 max-w-2xl mx-auto shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600 blur-[100px] rounded-full -mr-24 -mt-24 opacity-10" />
      
      <div className="mb-12 text-center relative z-10">
        <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">Place Order</h2>
        <p className="text-zinc-500 font-medium text-lg">Fast processing for your studio needs.</p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-10 relative z-10">
        {/* Unified Top Section: File Upload */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-widest px-1">
            1. Select Document or Photo
          </label>
          <div className="relative group">
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              accept="image/*,application/pdf"
            />
            <label
              htmlFor="file-upload"
              className={cn(
                "flex flex-col items-center justify-center w-full h-52 bg-zinc-800/30 border-2 border-dashed border-zinc-800 rounded-[2rem] cursor-pointer hover:bg-zinc-800/50 hover:border-blue-500 transition-all duration-500",
                filePreview && "border-blue-500 bg-blue-500/5 ring-8 ring-blue-500/5"
              )}
            >
              <div className="flex flex-col items-center justify-center">
                {filePreview ? (
                  <motion.div 
                    initial={{ scale: 0.8 }} 
                    animate={{ scale: 1 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-blue-500 font-bold text-lg">File Uploaded</p>
                    <p className="text-zinc-500 text-xs mt-1 font-medium">Click to change file</p>
                  </motion.div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-zinc-800 rounded-3xl flex items-center justify-center mb-4 border border-zinc-700 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <Upload className="w-7 h-7 text-zinc-500 group-hover:text-blue-500" />
                    </div>
                    <p className="text-zinc-400 font-bold text-lg">Drop file here or browse</p>
                    <p className="text-zinc-500 text-xs mt-1">PDF, PNG, JPG (MAX 5MB)</p>
                  </>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Customer Details */}
        <div className="space-y-6">
          <label className="text-xs font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-widest px-1">
            2. Customer Details
          </label>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  {...register("customerName")}
                  className={cn(
                    "w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl pl-12 pr-5 py-5 text-white placeholder-zinc-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all",
                    errors.customerName && "border-red-500/50 ring-red-500/5"
                  )}
                  placeholder="Full Name"
                />
              </div>
              {errors.customerName && (
                <p className="text-red-500 text-xs px-4">{errors.customerName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="relative group">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  {...register("phoneNumber")}
                  className={cn(
                    "w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl pl-12 pr-5 py-5 text-white placeholder-zinc-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all",
                    errors.phoneNumber && "border-red-500/50 ring-red-500/5"
                  )}
                  placeholder="WhatsApp Number"
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-red-500 text-xs px-4">{errors.phoneNumber.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative group">
              <FileText className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
              <select
                {...register("serviceType")}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl pl-12 pr-12 py-5 text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 appearance-none transition-all cursor-pointer"
              >
                <option value="B&W Photocopy">B&W Photocopy (3 BDT)</option>
                <option value="Passport Photo Printing">Passport Photo Printing (40 BDT)</option>
                <option value="Online Application">Online Application (100 BDT + Fees)</option>
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-600 font-bold py-5 rounded-[2rem] shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 text-lg active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Processing Order...
            </>
          ) : (
            <>
              Submit Order <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
