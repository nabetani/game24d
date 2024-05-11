z=3
w=900
h=900
g=100
cz=10
sw=w*z
sh=h*z
6.times do |d|
  cr = 1.2**(-d)
  n=(30*2**d).round
  draw = (1..n).map{
    col=[15,[*0..15].sample,[*0..15].sample].shuffle.map{ "%x" % _1 }.join
    x = rand(sw)
    y = rand(sh)
    r = cr * (rand(20.0)+4)
    " -fill '##{col}' -draw 'circle #{x},#{y} #{x+r},#{y}'"
  }.join(" ")
  modu = cr**2*100
  cmd = [
    "magick",
    "-size #{sw}x#{sh} canvas:none",
    draw,
    "-modulate #{modu}",
    "-resize #{w}x#{h}",
    "../../src/assets/bg#{d}.webp"
  ]
  cmdText = cmd.join(" ")
  puts cmdText
  puts %x( #{cmdText})
end
