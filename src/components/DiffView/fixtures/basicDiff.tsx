export default `diff --git a/src/components/DiffView.test.tsx b/src/components/DiffView.test.tsx
index 5ca1a30..4e2c90f 100644
--- a/src/components/DiffView.test.tsx
+++ b/src/components/DiffView.test.tsx
@@ -35,6 +35,8 @@ it('defaults the viewType to unified', () => {
 it('renders with a specified viewType', () => {
   const viewType = 'split';
   const root = render({ viewType });
+
+  expect(root).toHaveProp('viewType', viewType);
 });`;
