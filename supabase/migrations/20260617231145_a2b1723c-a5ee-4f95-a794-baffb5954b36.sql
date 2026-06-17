
DROP POLICY IF EXISTS "Public read empleados bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public insert empleados bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public update empleados bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public delete empleados bucket" ON storage.objects;
DROP POLICY IF EXISTS "quality_files_read" ON storage.objects;
DROP POLICY IF EXISTS "quality_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "quality_files_delete" ON storage.objects;

CREATE POLICY "Auth read empleados" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'empleados');
CREATE POLICY "Auth insert empleados" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'empleados');
CREATE POLICY "Auth update empleados" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'empleados') WITH CHECK (bucket_id = 'empleados');
CREATE POLICY "Auth delete empleados" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'empleados');

CREATE POLICY "Auth read quality-files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'quality-files');
CREATE POLICY "Auth insert quality-files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'quality-files');
CREATE POLICY "Auth update quality-files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'quality-files') WITH CHECK (bucket_id = 'quality-files');
CREATE POLICY "Auth delete quality-files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'quality-files');
