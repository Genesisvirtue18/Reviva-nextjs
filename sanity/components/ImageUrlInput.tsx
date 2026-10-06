import { useState } from 'react';
import { useFormValue } from 'sanity';
import { Button, Flex, Text, TextInput } from '@sanity/ui';
import { dataset, projectId } from '../../lib/sanity-env';

/* Shows the public URL of the uploaded image (built from the asset id, e.g.
   image-abc123-800x600-webp) so editors can paste it into a page's HTML. */
export function ImageUrlInput() {
  const ref = useFormValue(['image', 'asset', '_ref']) as string | undefined;
  const [copied, setCopied] = useState(false);
  const m = ref?.match(/^image-([a-f0-9]+-\d+x\d+)-(\w+)$/);
  if (!m) return <Text size={1} muted>Upload an image above to get its URL.</Text>;
  const url = `https://cdn.sanity.io/images/${projectId}/${dataset}/${m[1]}.${m[2]}`;
  return (
    <Flex gap={2}>
      <TextInput readOnly value={url} style={{ flex: 1 }} />
      <Button
        text={copied ? 'Copied' : 'Copy'}
        mode="ghost"
        onClick={() => navigator.clipboard.writeText(url).then(() => setCopied(true))}
      />
    </Flex>
  );
}
