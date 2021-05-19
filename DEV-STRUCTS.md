# Structures stored in MongoDB

## Example of an article

```
_id: 5e669af9c526c92f48a1fff5
format: 'Markdown'
title: 'Some nice title'
body: 'Loads of text here\nAnd Then some!'
pageID: '5e3d559dd97d47139423e84a' # This specifies the _id of the group (page or subpage)
order: 0 # Used to determine in what order the articles are displayed in this group
type: 'article'
```

## Example of a subgroup

```
_id: 5e3d559dd97d47139423e84a
type: 'group'
parId: '5e3d5594d97d47139423e849'
title: 'Iron Man'
order: 1
```

## Example of a group

```
_id: 5e3d5594d97d47139423e849
type: 'group'
parId: null
title: 'Heroes'
order: 9
```

## Example of settings

```
_id: 5eac28a2800fc2dc0f6fa78b
type: 'settings'
previousInput: 'Markdown'
bgColor: '#667A67'
dateDisplay: 'off'
fgColor: '#6A7996'
footerColor: '#45402A'
footerText: '2020 - Powered by TightCMS'
menuColor: '#597838'
pageTitle: 'TightSite'
pageWidth: '960px'
urlText: '/uploads/upper.jpg'
fontFamily: 'Verdana'
fontSize: '16px'
faviconPath: '/uploads/green.ico'
listImage: '/uploads/rounded_square.png'
bgPath: '/uploads/pie.jpg'
bgType: 'Fixed image'
fgPath: '/uploads/upper.jpg'
fgType: 'Solid color'
```
