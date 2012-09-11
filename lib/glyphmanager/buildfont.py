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
    #61440 is \xf000, beginning of private use
    glyph = font.createChar(61440+glyphid)

    glyph.clear()
    glyph.importOutlines("%i.svg" % glyphid)

    box = glyph.boundingBox()   
    dy = -(1000-(box[3]-box[1]))/2

    glyph.transform([1,0,0,1,0,dy])

    glyph.left_side_bearing = glyph.right_side_bearing = (glyph.width-(box[2]-box[0]))/2

font.generate("glyphs.ttf")
