import unittest
from discover import retain_catalog,multipart_key

def p(title,n,source="YouTube",verified=None):
    return dict(title=title,url="https://www.youtube.com/watch?v="+str(n).zfill(11),source=source,source_channel="same",playback_verified_run=verified)

class RetentionTests(unittest.TestCase):
    def test_pinned_group(self):
        parts=[p("Long Event Part 1 of 2",1),p("Long Event Part 2 of 2",2)]
        self.assertEqual(retain_catalog(parts+[p("New match",3)],1,1),parts)
    def test_unpinned_group_never_split(self):
        parts=[p("Long Event Part 1",1),p("Long Event Part 2",2)]
        self.assertEqual(retain_catalog(parts,0,1),[])
        self.assertEqual(retain_catalog(parts,0,2),parts)
    def test_different_providers(self):
        self.assertNotEqual(multipart_key(p("Long Event Part 1",1)),multipart_key(p("Long Event Part 2",2,"Internet Archive")))
    def test_standalone(self):
        self.assertIsNone(multipart_key(p("Billy Idol - White Wedding Pt 1",1)))

if __name__=="__main__":unittest.main()
