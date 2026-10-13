export const STARTER_COMPONENT = `import { Badge, Box, Card, Flex, Grid, Heading, Stack, Text } from "@sanity/ui";
import { CalendarIcon } from "@sanity/icons/Calendar";
import { StarIcon } from "@sanity/icons/Star";

// \`data\` is the document you fill in on the Form tab.
// \`urlFor(image)\` returns a URL for any image field.
// Save with Cmd+S (Ctrl+S) to update the Preview.

type Props = {
  data: Record<string, any>;
  urlFor: (source: unknown) => string;
};

export default function Preview({ data, urlFor }: Props) {
  const image = urlFor(data.mainImage);
  const blocks: any[] = Array.isArray(data.body) ? data.body : [];
  const tags: string[] = Array.isArray(data.tags) ? data.tags.filter(Boolean) : [];

  return (
    <Stack gap={5}>
      <Card radius={4} shadow={2} overflow="hidden">
        {image && (
          <img
            src={image}
            alt={data.mainImage?.alt ?? ""}
            style={{ display: "block", width: "100%", height: 260, objectFit: "cover" }}
          />
        )}
        <Stack gap={4} padding={5}>
          <Flex gap={2} wrap="wrap">
            {data.category && <Badge tone="primary">{data.category}</Badge>}
            {data.featured && (
              <Badge tone="caution">
                <Flex align="center" gap={1}>
                  <StarIcon /> Featured
                </Flex>
              </Badge>
            )}
          </Flex>
          <Heading size={4}>{data.title || "Untitled post"}</Heading>
          {data.excerpt && (
            <Text size={2} muted>
              {data.excerpt}
            </Text>
          )}
          {data.publishedAt && (
            <Flex align="center" gap={2}>
              <Text size={1} muted>
                <CalendarIcon />
              </Text>
              <Text size={1} muted>
                {new Date(data.publishedAt).toLocaleDateString(undefined, { dateStyle: "long" })}
              </Text>
            </Flex>
          )}
        </Stack>
      </Card>

      {blocks.length > 0 && (
        <Card radius={4} padding={5} border>
          <Stack gap={4}>
            {blocks.map((block, blockIndex) => (
              <Text key={block._key ?? blockIndex} size={2} style={{ lineHeight: 1.7 }}>
                {block.children?.map((child: any) => child.text).join("")}
              </Text>
            ))}
          </Stack>
        </Card>
      )}

      {tags.length > 0 && (
        <Grid columns={[1, 2, 3]} gap={3}>
          {tags.map((tag, tagIndex) => (
            <Card key={tagIndex} radius={3} padding={4} tone="primary" border>
              <Text size={1} weight="semibold">
                #{tag}
              </Text>
            </Card>
          ))}
        </Grid>
      )}

      {data.seo?.metaTitle && (
        <Card radius={3} padding={4} tone="transparent" border>
          <Stack gap={2}>
            <Text size={0} muted>
              Search result
            </Text>
            <Text size={2} weight="medium" style={{ color: "#1a0dab" }}>
              {data.seo.metaTitle}
            </Text>
            <Box>
              <Text size={1} muted>
                {data.seo.metaDescription}
              </Text>
            </Box>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
`;
