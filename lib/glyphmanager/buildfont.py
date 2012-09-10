#apt-get install fontforge python-fontforge

import sys
print("Building font")
print(sys.argv)

import fontforge

#http://tex.stackexchange.com/questions/22487/create-a-symbol-font-from-svg-symbols
font = fontforge.font("glyphs.ttf")

font.fontname = "Boxy"
font.fullname = "Boxy"
font.familyname = "Boxy"

for i in range(3,len(sys.argv)):
    glyphid = sys.argv[i]
    glyph = font.createChar(glyphid)

    glyph.importOutlines("%i.svg" % glyphid)
    ymin = glyph.boundingBox()[1]
    glyph.transform([1,0,0,1,0,-ymin])

    glyph.left_side_bearing = glyph.right_side_bearing = 0


font.generate("glyphs.ttf")
