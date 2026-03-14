import base64, os
home = os.environ['HOME']
with open(home+'/baxto-pro/gensite.js') as f:
    content = f.read()
start = content.index("'") + 1
end = content.rindex("'")
b64 = content[start:end]
html = base64.b64decode(b64)
with open(home+'/baxto-pro/public/index.html','wb') as f:
    f.write(html)
print('Listo!', len(html), 'bytes')
