#apt-get install fontforge python-fontforge

import sys
print("Building font")
print(sys.argv)

import fontforge

#http://tex.stackexchange.com/questions/22487/create-a-symbol-font-from-svg-symbols
font = fontforge.open("glyphs.ttf")

font.fontname = "Boxy"
font.fullname = "Boxy"
font.familyname = "Boxy"

for i in range(2,len(sys.argv)):
    glyphid = int(sys.argv[i])
    print(glyphid)
    glyph = font.createChar(glyphid)

    glyph.clear()
    glyph.importOutlines("%i.svg" % glyphid)
    ymin = glyph.boundingBox()[1]
    glyph.transform([1,0,0,1,0,-ymin])

    glyph.left_side_bearing = glyph.right_side_bearing = 0


font.generate("glyphs.ttf")
