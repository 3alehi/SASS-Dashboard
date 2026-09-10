import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsSectionPlaceholderProps {
  title: string;
  description: string;
  phaseLabel: string;
}

export function SettingsSectionPlaceholder({
  title,
  description,
  phaseLabel,
}: SettingsSectionPlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This section will be implemented in {phaseLabel}.
        </p>
      </CardContent>
    </Card>
  );
}
