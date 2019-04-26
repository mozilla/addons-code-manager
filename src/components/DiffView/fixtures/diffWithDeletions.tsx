export default `diff --git a/src/components/DiffView/index.tsx b/src/components/DiffView/index.tsx
index b7ee4f8..08a29b0 100644
--- a/src/components/DiffView/index.tsx
+++ b/src/components/DiffView/index.tsx
@@ -1,3 +1,10 @@
 import * as React from 'react';
-import { Diff, DiffProps, parseDiff } from 'react-diff-view';
+import {
+  Decoration,
+  Diff,
+  DiffProps,
+  Hunk,
+  HunkInfo,
+  parseDiff,
+} from 'react-diff-view';

@@ -16,3 +23,14 @@ class DiffView extends React.Component<Props> {

-  render = () => {
+  renderHunk(hunk: HunkInfo) {
+    console.log({ hunk });
+    return [
+      <Decoration key={\`decoration-\${hunk.content}\`}>
+        {hunk.content}
+      </Decoration>,
+      // @ts-ignore
+      <Hunk key={\`hunk-\${hunk.content}\`} hunk={hunk} />,
+    ];
+  }
+
+  render() {
     const { diff, viewType } = this.props;
@@ -29,3 +47,5 @@ class DiffView extends React.Component<Props> {
             viewType={viewType}
-          />
+          >
+            {(hunks: HunkInfo[]) => hunks.map(this.renderHunk)}
+          </Diff>
         ))}
@@ -33,3 +53,3 @@ class DiffView extends React.Component<Props> {
     );
-  };
+  }
 }`;
