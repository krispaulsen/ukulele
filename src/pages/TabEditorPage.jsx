import TabEditor from "../components/TabEditor";

export default function TabEditorPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold mb-2">Tab Editor</h2>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Build ukulele tablature on four strings (A, E, C, G). Copy the markup into a
        song&apos;s lyrics, or open this editor from the song form to insert it
        automatically.
      </p>
      <TabEditor mode="page" showMarkupPreview />
    </div>
  );
}
