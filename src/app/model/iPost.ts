export interface Post {
    id?: string,
    title: string,
    content: string,
    image?: string,
    video?: string,

    /*El campo nlikes podria ser un campo evaluado, aunque por desgracia,
    en firebase no se puede hacer uun orderby length de un array.
    Además no lo anoto como opcional ya que quiereo que la primera
    vez que sea insertado agregar un 0 ya que sino el order by no lo contará
    al no disponer de este campo
    */
    nLikes: number,

    usersLikes?: string[],
    date: Date,
    userId: string,
    userName: string
}