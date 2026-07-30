import TabEditor from "../components/TabEditor";

export default function TabEditorPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold mb-2">Tab Editor</h2>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Build ukulele tablature on four strings (A, E, C, G). Use{" "}
        <strong>Copy output</strong> for body lines ready to paste into a tablature
        field (no <code>[|</code> / <code>|]</code> wrappers), or open this editor
        from the song form to insert a full lyrics block automatically. Canonical
        form: uppercase string labels (<code>A|</code>…<code>G|</code>), frets{" "}
        <code>0</code>–<code>9</code>, frets 10–15 as lowercase <code>a</code>–
        <code>f</code>.
      </p>
      <TabEditor mode="page" showMarkupPreview />
    </div>
  );
}
