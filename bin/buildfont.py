#apt-get install fontforge python-fontforge
import fontforge

#http://tex.stackexchange.com/questions/22487/create-a-symbol-font-from-svg-symbols
font = fontforge.font()

font.fontname = "Boxy"
font.fullname = "Boxy"
font.familyname = "Boxy"

glyph = font.createChar(42)

glyph.importOutlines("noun_project_16.svg")
ymin = glyph.boundingBox()[1]
glyph.transform([1,0,0,1,0,-ymin])

glyph.left_side_bearing = glyph.right_side_bearing = 0

font.generate("boxy.ttf")
