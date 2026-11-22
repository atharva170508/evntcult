"use client";

import { CheckIcon, ImagePlusIcon, XIcon } from "lucide-react";
import { useId } from "react";

import { useCharacterLimit } from "@/registry/default/hooks/use-character-limit";
import { useFileUpload } from "@/registry/default/hooks/use-file-upload";
import { Button } from "@/registry/default/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/default/ui/dialog";
import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";
import { Textarea } from "@/registry/default/ui/textarea";

// Pretend we have initial image files
const initialBgImage = [
  {
    id: "profile-bg-123456789",
    name: "profile-bg.jpg",
    size: 1528737,
    type: "image/jpeg",
    url: "/origin/profile-bg.jpg",
  },
];

const initialAvatarImage = [
  {
    id: "avatar-123456789",
    name: "avatar-72-01.jpg",
    size: 1528737,
    type: "image/jpeg",
    url: "/origin/avatar-72-01.jpg",
  },
];

export default function Component() {
  const id = useId();

  const maxLength = 180;
  const {
    value,
    characterCount,
    handleChange,
    maxLength: limit,
  } = useCharacterLimit({
    initialValue:
      "Hey, I am Margaret, a web developer who loves turning ideas into amazing websites!",
    maxLength,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit profile</Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-0 overflow-y-visible p-0 sm:max-w-lg [&>button:last-child]:top-3.5">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4 text-base">
            Edit profile
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Make changes to your profile here. You can change your photo and set a
          username.
        </DialogDescription>
        <div className="overflow-y-auto">
          <ProfileBg />
          <Avatar />
          <div className="px-6 pt-4 pb-6">
            <form className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`${id}-first-name`}>First name</Label>
                  <Input
                    defaultValue="Margaret"
                    id={`${id}-first-name`}
                    placeholder="Matt"
                    required
                    type="text"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`${id}-last-name`}>Last name</Label>
                  <Input
                    defaultValue="Villard"
                    id={`${id}-last-name`}
                    placeholder="Welsh"
                    required
                    type="text"
                  />
                </div>
              </div>
              <div className="*:not-first:mt-2">
                <Label htmlFor={`${id}-username`}>Username</Label>
                <div className="relative">
                  <Input
                    className="peer pe-9"
                    defaultValue="margaret-villard-69"
                    id={`${id}-username`}
                    placeholder="Username"
                    required
                    type="text"
                  />
                  <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                    <CheckIcon
                      aria-hidden="true"
                      className="text-emerald-500"
                      size={16}
                    />
                  </div>
                </div>
              </div>
              <div className="*:not-first:mt-2">
                <Label htmlFor={`${id}-website`}>Website</Label>
                <div className="flex rounded-md shadow-xs">
                  <span className="-z-10 inline-flex items-center rounded-s-md border border-input bg-background px-3 text-muted-foreground text-sm">
                    https://
                  </span>
                  <Input
                    className="-ms-px rounded-s-none shadow-none"
                    defaultValue="www.margaret.com"
                    id={`${id}-website`}
                    placeholder="yourwebsite.com"
                    type="text"
                  />
                </div>
              </div>
              <div className="*:not-first:mt-2">
                <Label htmlFor={`${id}-bio`}>Biography</Label>
                <Textarea
                  aria-describedby={`${id}-description`}
                  defaultValue={value}
                  id={`${id}-bio`}
                  maxLength={maxLength}
                  onChange={handleChange}
                  placeholder="Write a few sentences about yourself"
                />
                <p
                  aria-live="polite"
                  className="mt-2 text-right text-muted-foreground text-xs"
                  id={`${id}-description`}
                  role="status"
                >
                  <span className="tabular-nums">{limit - characterCount}</span>{" "}
                  characters left
                </p>
              </div>
            </form>
          </div>
        </div>
        <DialogFooter className="border-t px-6 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button">Save changes</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProfileBg() {
  const [{ files }, { removeFile, openFileDialog, getInputProps }] =
    useFileUpload({
      accept: "image/*",
      initialFiles: initialBgImage,
    });

  const currentImage = files[0]?.preview || null;

  return (
    <div className="h-32">
      <div className="relative flex size-full items-center justify-center overflow-hidden bg-muted">
        {currentImage && (
          <img
            alt={
              files[0]?.preview
                ? "Upload preview"
                : "Default profile background"
            }
            className="size-full object-cover"
            height={96}
            src={currentImage}
            width={512}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <button
            aria-label={currentImage ? "Change image" : "Upload image"}
            className="z-50 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-none transition-[color,box-shadow] hover:bg-black/80 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onClick={openFileDialog}
            type="button"
          >
            <ImagePlusIcon aria-hidden="true" size={16} />
          </button>
          {currentImage && (
            <button
              aria-label="Remove image"
              className="z-50 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-none transition-[color,box-shadow] hover:bg-black/80 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              onClick={() => removeFile(files[0]?.id)}
              type="button"
            >
              <XIcon aria-hidden="true" size={16} />
            </button>
          )}
        </div>
      </div>
      <input
        {...getInputProps()}
        aria-label="Upload image file"
        className="sr-only"
      />
    </div>
  );
}

function Avatar() {
  const [{ files }, { openFileDialog, getInputProps }] = useFileUpload({
    accept: "image/*",
    initialFiles: initialAvatarImage,
  });

  const currentImage = files[0]?.preview || null;

  return (
    <div className="-mt-10 px-6">
      <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted shadow-black/10 shadow-xs">
        {currentImage && (
          <img
            alt="Profile"
            className="size-full object-cover"
            height={80}
            src={currentImage}
            width={80}
          />
        )}
        <button
          aria-label="Change profile picture"
          className="absolute flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-none transition-[color,box-shadow] hover:bg-black/80 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onClick={openFileDialog}
          type="button"
        >
          <ImagePlusIcon aria-hidden="true" size={16} />
        </button>
        <input
          {...getInputProps()}
          aria-label="Upload profile picture"
          className="sr-only"
        />
      </div>
    </div>
  );
}
