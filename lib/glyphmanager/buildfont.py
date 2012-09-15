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

    #This isn't perfect since the bounding box appears to lie sometimes
    box = glyph.boundingBox()

    scale = min(750/(box[3]-box[1]), 750/(box[2]-box[0]))
    glyph.transform([scale,0,0,scale,0,0])

    box = glyph.boundingBox()

    dy = -(500-(box[3]-box[1]))/2

    glyph.transform([1,0,0,1,0,dy])

    glyph.left_side_bearing = glyph.right_side_bearing = (glyph.width-(box[2]-box[0]))/2

font.generate("glyphs.ttf")
