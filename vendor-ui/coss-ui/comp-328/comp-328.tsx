"use client";

import { CreditCardIcon, WalletIcon } from "lucide-react";
import { useId } from "react";
import { usePaymentInputs } from "react-payment-inputs";
import images, { type CardImages } from "react-payment-inputs/images";

import { Button } from "@/registry/default/ui/button";
import { Checkbox } from "@/registry/default/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/default/ui/dialog";
import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";

export default function Component() {
  const id = useId();
  const {
    meta,
    getCardNumberProps,
    getExpiryDateProps,
    getCVCProps,
    getCardImageProps,
  } = usePaymentInputs();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Card details</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col gap-2">
          <div
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border"
          >
            <WalletIcon className="opacity-80" size={16} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-left">Update your card</DialogTitle>
            <DialogDescription className="text-left">
              Your new card will replace your current card.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5">
          <div className="space-y-4">
            <div className="*:not-first:mt-2">
              <Label htmlFor={`name-${id}`}>Name on card</Label>
              <Input id={`name-${id}`} required type="text" />
            </div>
            <div className="*:not-first:mt-2">
              <Label htmlFor={`number-${id}`}>Card Number</Label>
              <div className="relative">
                <Input
                  {...getCardNumberProps()}
                  className="peer pe-9 [direction:inherit]"
                  id={`number-${id}`}
                />
                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                  {meta.cardType ? (
                    <svg
                      className="overflow-hidden rounded-sm"
                      {...getCardImageProps({
                        images: images as unknown as CardImages,
                      })}
                      width={20}
                    />
                  ) : (
                    <CreditCardIcon aria-hidden="true" size={16} />
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`expiry-${id}`}>Expiry date</Label>
                <Input
                  className="[direction:inherit]"
                  {...getExpiryDateProps()}
                  id={`expiry-${id}`}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor={`cvc-${id}`}>CVC</Label>
                <Input
                  className="[direction:inherit]"
                  {...getCVCProps()}
                  id={`cvc-${id}`}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id={`primary-${id}`} />
            <Label
              className="font-normal text-muted-foreground"
              htmlFor={`primary-${id}`}
            >
              Set as default payment method
            </Label>
          </div>
          <Button className="w-full" type="button">
            Update card
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
