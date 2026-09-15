'use client';

import {FC, useEffect, useMemo} from 'react';
import {Avatar, Button, FileUpload, HStack, useFileUploadContext} from '@chakra-ui/react';
import type {UseFormRegisterReturn} from 'react-hook-form';
import {BiUpload} from 'react-icons/bi';

type AvatarPreviewProps = {
    /** Name the avatar falls back to while there is no picture at all. */
    name?: string;
    /** Picture to show until a new file is picked (the saved one, or none). */
    src?: string | null;
};

// FileUpload.Root already keeps the picked file, so the preview reads it from
// the context instead of the form mirroring the FileList by hand.
const AvatarPreview: FC<AvatarPreviewProps> = ({name, src}) => {
    const {acceptedFiles} = useFileUploadContext();
    const [file] = acceptedFiles;

    const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file]);

    useEffect(() => {
        if (!objectUrl) return;
        return () => URL.revokeObjectURL(objectUrl);
    }, [objectUrl]);

    // Nothing picked yet — keep showing whatever is already saved.
    const previewSrc = objectUrl ?? src;

    return (
        <Avatar.Root size="lg" colorPalette="pink">
            <Avatar.Fallback name={name} />
            {previewSrc && <Avatar.Image src={previewSrc} />}
        </Avatar.Root>
    );
};

type AvatarUploadProps = AvatarPreviewProps & UseFormRegisterReturn & {
    /** Result of `register('photo')` — the form still owns the submitted value. */
    label?: string;
    nickname?: string
};

const AvatarUpload: FC<AvatarUploadProps> = ({ nickname = 'Цуцик', src, label = 'Аватарка', ...rest}) => (
    <FileUpload.Root accept="image/*">
        <HStack gap={3}>
            <FileUpload.HiddenInput {...rest} />
            <FileUpload.Trigger asChild>
                <Button variant="outline" size="sm">
                    <BiUpload /> {label}
                </Button>
            </FileUpload.Trigger>
            <AvatarPreview name={nickname} src={src} />
        </HStack>
    </FileUpload.Root>
);

export default AvatarUpload;
